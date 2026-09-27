#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod models;
mod scanner;
mod thumbnail;
mod commands;
mod db; 

use models::AppState;
use tokio::sync::Semaphore;
use tauri::Manager;
use std::fs;
use std::sync::Mutex;
use std::sync::Arc;

// 🔥 FFPROBE & FFMPEG IMPORTS
use serde::{Deserialize, Serialize};
use std::process::{Command, Stdio};
use serde_json::Value;
use std::env;

#[derive(Serialize, Deserialize, Clone)]
pub struct TrackInfo {
    pub index: usize,
    pub codec_type: String,
    pub codec_name: String,
    pub language: String,
    pub title: String,
}

// 🔥 GLOBAL MEDIA STREAMING STATE (Backend-driven stream routing)
pub struct MediaStreamState {
    pub current_path: Mutex<String>,
    pub audio_index: Mutex<usize>,
}

// 🛠️ HELPER: Tauri protocol URLs ko fully decode karna
fn clean_video_path(video_path: &str) -> String {
    let mut cleaned = video_path.to_string();
    
    for prefix in &[
        "http://asset.localhost/",
        "https://asset.localhost/",
        "http://tauri.localhost/",
        "https://tauri.localhost/",
        "asset://",
        "tauri://",
    ] {
        if cleaned.starts_with(prefix) {
            cleaned = cleaned.replace(prefix, "");
            break;
        }
    }
    
    cleaned = cleaned
        .replace("%3A", ":")
        .replace("%3a", ":")
        .replace("%20", " ")
        .replace("%5C", "\\")
        .replace("%2F", "/")
        .replace("%2f", "/");

    cleaned
}

#[derive(Serialize, Deserialize, Clone)]
pub struct MediaMetadata {
    pub tracks: Vec<TrackInfo>,
    pub duration: f64,
}

// 🔥 COMMAND 1: Video ke saare tracks aur exact duration nikalna via ffprobe
#[tauri::command]
async fn get_video_tracks(video_path: String) -> Result<MediaMetadata, String> {
    let real_path = clean_video_path(&video_path);
    println!("🔍 [RUST DEBUG] Scanning video path: {}", real_path);

    let output = Command::new("ffprobe")
        .args([
            "-v", "quiet", 
            "-print_format", "json", 
            "-show_streams", 
            "-show_format", // 🔥 Duration ke liye format metadata zaroori hai
            &real_path
        ])
        .output()
        .map_err(|e| format!("Failed to run ffprobe: {}", e))?;

    let json: Value = serde_json::from_slice(&output.stdout)
        .map_err(|e| format!("Invalid JSON from ffprobe: {}", e))?;

    // 🔥 Exact video duration extract karna
    let duration = json["format"]["duration"]
        .as_str()
        .and_then(|d| d.parse::<f64>().ok())
        .unwrap_or(0.0);

    let mut tracks = Vec::new();
    if let Some(streams) = json["streams"].as_array() {
        println!("📦 [RUST DEBUG] Total streams found: {}", streams.len());
        for stream in streams {
            let codec_type = stream["codec_type"].as_str().unwrap_or("").to_string();
            
            if codec_type == "audio" || codec_type == "subtitle" {
                let index = stream["index"].as_u64().unwrap_or(0) as usize;
                let codec_name = stream["codec_name"].as_str().unwrap_or("unknown").to_string();
                
                let tags = stream.get("tags");
                let language = tags.and_then(|t| t.get("language")).and_then(|l| l.as_str()).unwrap_or("und").to_string();
                let title = tags.and_then(|t| t.get("title")).and_then(|t| t.as_str()).unwrap_or("").to_string();

                println!("✅ [TRACK DETECTED] Type: {}, Index: {}, Lang: {}, Title: {}", codec_type, index, language, title);
                tracks.push(TrackInfo { index, codec_type, codec_name, language, title });
            }
        }
    }

    Ok(MediaMetadata { tracks, duration })
}

// 🔥 COMMAND 2: Selected Subtitle ko .VTT format mein extract karna via ffmpeg
#[tauri::command]
async fn extract_subtitle_vtt(video_path: String, stream_index: usize) -> Result<String, String> {
    let real_path = clean_video_path(&video_path);

    let mut temp_path = env::temp_dir();
    temp_path.push(format!("auvem_sub_{}.vtt", stream_index));
    let out_path_str = temp_path.to_string_lossy().to_string();

    let status = Command::new("ffmpeg")
        .args([
            "-y", 
            "-i", &real_path,
            "-map", &format!("0:{}", stream_index),
            "-f", "webvtt",
            &out_path_str
        ])
        .status()
        .map_err(|e| format!("Failed to run ffmpeg: {}", e))?;

    if status.success() {
        // 🔥 File path ke bajaye direct VTT text content read karke return karo
        let vtt_content = fs::read_to_string(&temp_path)
            .map_err(|e| format!("Failed to read VTT file: {}", e))?;
        Ok(vtt_content)
    } else {
        Err("Failed to extract subtitle".into())
    }
}

// 🔥 COMMAND 3: Backend-driven Audio Stream Switcher
#[tauri::command]
fn set_active_media_stream(state: tauri::State<'_, Arc<MediaStreamState>>, video_path: String, audio_index: usize) -> String {
    let real_path = clean_video_path(&video_path);
    let mut path_lock = state.current_path.lock().unwrap();
    let mut audio_lock = state.audio_index.lock().unwrap();
    
    *path_lock = real_path;
    *audio_lock = audio_index; 
    
    println!("🎛️ [MEDIA SERVER] Active Stream Updated -> Path: {}, Audio Index: {}", *path_lock, *audio_lock);
    "http://127.0.0.1:39393/stream".into()
}

fn main() {
    let media_state = Arc::new(MediaStreamState {
        current_path: Mutex::new("".into()),
        audio_index: Mutex::new(1),
    });

    let media_state_clone = media_state.clone();

    // 🔥 BACKGROUND EMBEDDED HTTP STREAMING SERVER (FIXED FOR PIPING)
    std::thread::spawn(move || {
        let server = tiny_http::Server::http("127.0.0.1:39393").unwrap();
        println!("🚀 [HTTP STREAM SERVER] Running on http://127.0.0.1:39393/stream");

        for request in server.incoming_requests() {
            let state = media_state_clone.clone();
            let video_path = { state.current_path.lock().unwrap().clone() };
            let audio_idx = { *state.audio_index.lock().unwrap() };

            if video_path.is_empty() {
                let _ = request.respond(tiny_http::Response::from_string("No media loaded").with_status_code(404));
                continue;
            }

            println!("📺 [STREAMING] Spawning FFmpeg for: {} | Audio Map: 0:{}", video_path, audio_idx);

            let mut ffmpeg_child = match Command::new("ffmpeg")
                .args([
                    "-i", &video_path,
                    "-map", "0:0",                  
                    "-map", &format!("0:{}", audio_idx), 
                    "-c:v", "copy",                 
                    "-c:a", "aac",                  
                    "-f", "mp4",                    
                    "-movflags", "frag_keyframe+empty_moov", // 🔥 Fix: Removed 'faststart' because pipe:1 is unseekable!
                    "pipe:1"
                ])
                .stdout(Stdio::piped())
                .stderr(Stdio::null())
                .spawn() {
                    Ok(child) => child,
                    Err(_) => continue,
                };

            let stdout = ffmpeg_child.stdout.take().unwrap();
            
            // 🔥 Fix: Removed Accept-Ranges header for smooth continuous live streaming over pipe
            let response = tiny_http::Response::new(
                tiny_http::StatusCode(200),
                vec![
                    tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"video/mp4"[..]).unwrap(),
                ],
                stdout,
                None,
                None,
            );

            let _ = request.respond(response);
        }
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(media_state)
        .setup(|app| {
            let app_dir = app.path().app_data_dir().unwrap();
            
            if !app_dir.exists() {
                fs::create_dir_all(&app_dir).unwrap();
            }
            
            let db_path = app_dir.join("auvem_gallery.db");
            let db_conn = db::init_db(&db_path).expect("Failed to initialize database");

            app.manage(AppState {
                thumbnail_queue: Semaphore::new(4), 
                db: Mutex::new(db_conn), 
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::fetch_synced_images,
            commands::get_filtered_chunk, 
            commands::get_thumbnail,
            commands::get_opened_file,
            commands::get_auto_albums,
            get_video_tracks,
            extract_subtitle_vtt,
            set_active_media_stream
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}