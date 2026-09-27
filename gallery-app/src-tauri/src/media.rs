use serde::{Deserialize, Serialize};
use std::process::Command;
use serde_json::Value;
use std::env;
use std::fs;
use std::sync::{Arc, Mutex};

#[derive(Serialize, Deserialize, Clone)]
pub struct TrackInfo {
    pub index: usize,
    pub codec_type: String,
    pub codec_name: String,
    pub language: String,
    pub title: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct MediaMetadata {
    pub tracks: Vec<TrackInfo>,
    pub duration: f64,
}

pub struct MediaStreamState {
    pub current_path: Mutex<String>,
    pub audio_index: Mutex<usize>,
}

pub fn clean_video_path(video_path: &str) -> String {
    let mut cleaned = video_path.to_string();
    for prefix in &[
        "http://asset.localhost/", "https://asset.localhost/",
        "http://tauri.localhost/", "https://tauri.localhost/",
        "asset://", "tauri://",
    ] {
        if cleaned.starts_with(prefix) {
            cleaned = cleaned.replace(prefix, "");
            break;
        }
    }
    cleaned.replace("%3A", ":").replace("%3a", ":").replace("%20", " ").replace("%5C", "\\").replace("%2F", "/").replace("%2f", "/")
}

#[tauri::command]
pub async fn get_video_tracks(video_path: String) -> Result<MediaMetadata, String> {
    let real_path = clean_video_path(&video_path);
    println!("🔍 [RUST DEBUG] Scanning video path: {}", real_path);

    let output = Command::new("ffprobe")
        .args(["-v", "quiet", "-print_format", "json", "-show_streams", "-show_format", &real_path])
        .output()
        .map_err(|e| format!("Failed to run ffprobe: {}", e))?;

    let json: Value = serde_json::from_slice(&output.stdout).map_err(|e| format!("Invalid JSON from ffprobe: {}", e))?;
    let duration = json["format"]["duration"].as_str().and_then(|d| d.parse::<f64>().ok()).unwrap_or(0.0);
    let mut tracks = Vec::new();

    if let Some(streams) = json["streams"].as_array() {
        for stream in streams {
            let codec_type = stream["codec_type"].as_str().unwrap_or("").to_string();
            if codec_type == "audio" || codec_type == "subtitle" {
                let index = stream["index"].as_u64().unwrap_or(0) as usize;
                let codec_name = stream["codec_name"].as_str().unwrap_or("unknown").to_string();
                let tags = stream.get("tags");
                let language = tags.and_then(|t| t.get("language")).and_then(|l| l.as_str()).unwrap_or("und").to_string();
                let title = tags.and_then(|t| t.get("title")).and_then(|t| t.as_str()).unwrap_or("").to_string();
                tracks.push(TrackInfo { index, codec_type, codec_name, language, title });
            }
        }
    }
    Ok(MediaMetadata { tracks, duration })
}

#[tauri::command]
pub async fn extract_subtitle_vtt(video_path: String, stream_index: usize) -> Result<String, String> {
    let real_path = clean_video_path(&video_path);
    let mut temp_path = env::temp_dir();
    temp_path.push(format!("auvem_sub_{}.vtt", stream_index));
    let out_path_str = temp_path.to_string_lossy().to_string();

    let status = Command::new("ffmpeg")
        .args(["-y", "-i", &real_path, "-map", &format!("0:{}", stream_index), "-f", "webvtt", &out_path_str])
        .status()
        .map_err(|e| format!("Failed to run ffmpeg: {}", e))?;

    if status.success() {
        fs::read_to_string(&temp_path).map_err(|e| format!("Failed to read VTT file: {}", e))
    } else {
        Err("Failed to extract subtitle".into())
    }
}

#[tauri::command]
pub fn set_active_media_stream(state: tauri::State<'_, Arc<MediaStreamState>>, video_path: String, audio_index: usize) -> String {
    let real_path = clean_video_path(&video_path);
    let mut path_lock = state.current_path.lock().unwrap();
    let mut audio_lock = state.audio_index.lock().unwrap();
    *path_lock = real_path;
    *audio_lock = audio_index; 
    println!("🎛️ [MEDIA SERVER] Active Stream Updated -> Path: {}, Audio Index: {}", *path_lock, *audio_lock);
    "http://127.0.0.1:39393/stream".into()
}