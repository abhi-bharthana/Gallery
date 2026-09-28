// src-tauri/src/server.rs
use std::process::{Command, Stdio, Child};
use std::sync::{Arc, Mutex};
use std::path::PathBuf;
use std::io::Write;
use tauri::Manager;
use aes_gcm::{aead::{Aead, KeyInit}, Aes256Gcm, Nonce};
use crate::media::MediaStreamState;

// Simple custom URL decoder (no external crates needed)
fn decode_url(input: &str) -> String {
    let mut result = Vec::new();
    let bytes = input.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(byte) = u8::from_str_radix(std::str::from_utf8(&bytes[i+1..i+3]).unwrap_or(""), 16) {
                result.push(byte);
                i += 3;
                continue;
            }
        } else if bytes[i] == b'+' {
            result.push(b' ');
        } else {
            result.push(bytes[i]);
        }
        i += 1;
    }
    String::from_utf8(result).unwrap_or(input.to_string())
}

// 🔥 NAYA: AppHandle accept karega taaki Vault config ka rasta mil sake
pub fn start_streaming_server(media_state_clone: Arc<MediaStreamState>, app_handle: tauri::AppHandle) {
    let app_dir = app_handle.path().app_data_dir().unwrap();

    std::thread::spawn(move || {
        let server = tiny_http::Server::http("127.0.0.1:39393").unwrap();
        println!("🚀 [ZERO-TRACE SERVER] Running on http://127.0.0.1:39393");

        let active_process: Arc<Mutex<Option<Child>>> = Arc::new(Mutex::new(None));

        for request in server.incoming_requests() {
            let state = media_state_clone.clone();
            let active_process = active_process.clone();
            let app_dir = app_dir.clone();

            std::thread::spawn(move || {
                let url = request.url().to_string();

                // 🖼️ 🔥 IMAGE & THUMBNAIL DECRYPTION ROUTE
                if url.starts_with("/media") {
                    let mut file_path = String::new();
                    if let Some(pos) = url.find("path=") {
                        let rest = &url[pos + 5..];
                        let end = rest.find('&').unwrap_or(rest.len());
                        file_path = decode_url(&rest[..end]);
                    }

                    if !file_path.ends_with(".enc") {
                        let _ = request.respond(tiny_http::Response::from_string("Not vaulted").with_status_code(400));
                        return;
                    }

                    if let Some(decrypted_bytes) = decrypt_vault_file(&file_path, &app_dir) {
                        let data_len = decrypted_bytes.len(); // 🔥 FIX 1: Exact size

                        // Determine content type heuristically or fallback to general image
                        let content_type = "image/jpeg"; // 🔥 FIX 2: Better browser acceptance

                        let response = tiny_http::Response::new(
                            tiny_http::StatusCode(200),
                            vec![
                                tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap(),
                                tiny_http::Header::from_bytes(&b"Content-Type"[..], content_type.as_bytes()).unwrap(),
                                tiny_http::Header::from_bytes(&b"Cache-Control"[..], &b"no-store"[..]).unwrap(), 
                            ],
                            std::io::Cursor::new(decrypted_bytes),
                            Some(data_len), // Length add kiya
                            None,
                        );
                        let _ = request.respond(response);
                    } else {
                        let _ = request.respond(tiny_http::Response::from_string("Decrypt Fail").with_status_code(500));
                    }
                    return;
                }

                // 🎬 🔥 VIDEO STREAMING ROUTE
                let video_path = { state.current_path.lock().unwrap().clone() };
                let audio_idx = { *state.audio_index.lock().unwrap() };

                if video_path.is_empty() {
                    let _ = request.respond(tiny_http::Response::from_string("No media").with_status_code(404));
                    return;
                }

                let mut start_time = "0".to_string();
                if let Some(pos) = url.find("start=") {
                    let rest = &url[pos + 6..];
                    let end = rest.find('&').unwrap_or(rest.len());
                    start_time = rest[..end].to_string();
                }

                {
                    let mut prev_process = active_process.lock().unwrap();
                    if let Some(mut child) = prev_process.take() {
                        let _ = child.kill();
                        let _ = child.wait();
                    }
                }

                let is_vaulted = video_path.ends_with(".enc");
                let mut ffmpeg_cmd = Command::new("ffmpeg");
                
                if is_vaulted {
                    // 🔥 If encrypted, FFmpeg reads from pipe (RAM) instead of disk!
                    ffmpeg_cmd.args(["-ss", &start_time, "-i", "pipe:0"]);
                } else {
                    ffmpeg_cmd.args(["-ss", &start_time, "-i", &video_path]);
                }

                ffmpeg_cmd.args([
                    "-map", "0:0",                  
                    "-map", &format!("0:{}", audio_idx), 
                    "-c:v", "copy",                 
                    "-c:a", "aac",                  
                    "-f", "mp4",                    
                    "-movflags", "frag_keyframe+empty_moov",
                    "pipe:1"
                ]);
                
                if is_vaulted {
                    ffmpeg_cmd.stdin(Stdio::piped());
                }
                ffmpeg_cmd.stdout(Stdio::piped());
                ffmpeg_cmd.stderr(Stdio::null());

                let mut ffmpeg_child = match ffmpeg_cmd.spawn() {
                    Ok(child) => child,
                    Err(_) => return,
                };

                // 🔥 ON-THE-FLY VIDEO DECRYPTION THREAD
                if is_vaulted {
                    if let Some(mut stdin) = ffmpeg_child.stdin.take() {
                        let v_path = video_path.clone();
                        let dir_clone = app_dir.clone();
                        std::thread::spawn(move || {
                            if let Some(decrypted_bytes) = decrypt_vault_file(&v_path, &dir_clone) {
                                let _ = stdin.write_all(&decrypted_bytes); // Stream directly to FFmpeg
                            }
                        });
                    }
                }

                let stdout = ffmpeg_child.stdout.take().unwrap();
                let pid = ffmpeg_child.id();

                {
                    let mut current_process = active_process.lock().unwrap();
                    *current_process = Some(ffmpeg_child);
                }

                let response = tiny_http::Response::new(
                    tiny_http::StatusCode(200),
                    vec![
                        tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"video/mp4"[..]).unwrap(),
                        tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap(),
                    ],
                    stdout, None, None,
                );

                let _ = request.respond(response);
                
                {
                    let mut process_lock = active_process.lock().unwrap();
                    let mut should_kill = false;
                    if let Some(child) = process_lock.as_ref() {
                        if child.id() == pid { should_kill = true; }
                    }
                    if should_kill {
                        if let Some(mut child) = process_lock.take() {
                            let _ = child.kill();
                            let _ = child.wait();
                        }
                    }
                }
            });
        }
    });
}

// 🔐 HELPER: Fast AES Decryption in RAM
fn decrypt_vault_file(file_path: &str, app_dir: &PathBuf) -> Option<Vec<u8>> {
    let mut config_path = app_dir.clone();
    config_path.push("com.auvem.gallery");
    config_path.push(".auvem_vault");
    config_path.push("vault_config.json");

    let config_data = std::fs::read_to_string(&config_path).ok()?;
    let config_json: serde_json::Value = serde_json::from_str(&config_data).ok()?;
    let master_hash = config_json.get("master_hash")?.as_str()?;

    let mut key = [0u8; 32];
    for (i, &byte) in master_hash.as_bytes().iter().cycle().take(32).enumerate() {
        key[i] = byte;
    }

    let encrypted_data = std::fs::read(file_path).ok()?;
    if encrypted_data.len() < 12 { return None; }

    let (nonce_bytes, ciphertext) = encrypted_data.split_at(12);
    
    let cipher_key = aes_gcm::Key::<Aes256Gcm>::try_from(key.as_slice()).ok()?;
    let cipher = Aes256Gcm::new(&cipher_key);
    let nonce = Nonce::try_from(nonce_bytes).ok()?;
    
    cipher.decrypt(&nonce, ciphertext).ok()
}