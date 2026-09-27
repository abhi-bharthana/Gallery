// src-tauri/src/server.rs
use std::process::{Command, Stdio, Child};
use std::sync::{Arc, Mutex};
use crate::media::MediaStreamState;

pub fn start_streaming_server(media_state_clone: Arc<MediaStreamState>) {
    std::thread::spawn(move || {
        let server = tiny_http::Server::http("127.0.0.1:39393").unwrap();
        println!("🚀 [HTTP STREAM SERVER] Running on http://127.0.0.1:39393/stream");

        // 🔥 THE MASTER FIX: Puraane FFmpeg processes ko track karne ke liye global state
        let active_process: Arc<Mutex<Option<Child>>> = Arc::new(Mutex::new(None));

        for request in server.incoming_requests() {
            let state = media_state_clone.clone();
            let active_process = active_process.clone(); // Naye thread mein pass karne ke liye clone

            std::thread::spawn(move || {
                let video_path = { state.current_path.lock().unwrap().clone() };
                let audio_idx = { *state.audio_index.lock().unwrap() };

                if video_path.is_empty() {
                    let _ = request.respond(tiny_http::Response::from_string("No media loaded").with_status_code(404));
                    return;
                }

                let url = request.url();
                let mut start_time = "0".to_string();
                if let Some(pos) = url.find("start=") {
                    let rest = &url[pos + 6..];
                    let end = rest.find('&').unwrap_or(rest.len());
                    start_time = rest[..end].to_string();
                }

                println!("📺 [STREAMING THREAD] Audio: 0:{}, Start: {}s", audio_idx, start_time);

                // 🔥 STEP 1: Naya stream shuru karne se pehle purane process ko forcefully kill karo!
                {
                    let mut prev_process = active_process.lock().unwrap();
                    if let Some(mut child) = prev_process.take() {
                        let _ = child.kill();
                        let _ = child.wait(); // Zombie process rokne ke liye OS ko clear karne do
                        println!("🛑 [PROCESS KILLED] Stopped previous FFmpeg instance.");
                    }
                }

                let mut ffmpeg_child = match Command::new("ffmpeg")
                    .args([
                        "-ss", &start_time,             
                        "-i", &video_path,
                        "-map", "0:0",                  
                        "-map", &format!("0:{}", audio_idx), 
                        "-c:v", "copy",                 
                        "-c:a", "aac",                  
                        "-f", "mp4",                    
                        "-movflags", "frag_keyframe+empty_moov",
                        "pipe:1"
                    ])
                    .stdout(Stdio::piped())
                    .stderr(Stdio::null())
                    .spawn() {
                        Ok(child) => child,
                        Err(_) => return,
                    };

                let stdout = ffmpeg_child.stdout.take().unwrap();
                let pid = ffmpeg_child.id(); // Process ID track karenge current instance ka

                // 🔥 STEP 2: Naye process ko global state mein set karo
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

                // Jaise hi browser stream cancel karega (seek pe ya viewer band karne pe), yeh break ho jayega.
                let _ = request.respond(response);
                
                // 🔥 STEP 3: Cleanup - Agar yeh request gracefully drop hoti hai, toh stream ko kill karo
                {
                    let mut process_lock = active_process.lock().unwrap();
                    let mut should_kill = false;
                    
                    // Hum check karenge ki state mein wahi process hai jo is thread ne start kiya tha
                    if let Some(child) = process_lock.as_ref() {
                        if child.id() == pid {
                            should_kill = true;
                        }
                    }

                    if should_kill {
                        if let Some(mut child) = process_lock.take() {
                            let _ = child.kill();
                            let _ = child.wait();
                            println!("🛑 [STREAM ENDED] Cleaned up FFmpeg (PID: {})", pid);
                        }
                    }
                }
            });
        }
    });
}