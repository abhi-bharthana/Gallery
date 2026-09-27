use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;
use crate::media::clean_video_path;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VideoHistory {
    pub progress: f64,
    pub duration: f64,
    pub audio_lang: String,
    pub sub_lang: String,
    pub last_watched_at: u64,
}

fn get_history_path(app: &tauri::AppHandle) -> std::path::PathBuf {
    app.path().app_data_dir().unwrap().join("history.json")
}

fn read_history(app: &tauri::AppHandle) -> HashMap<String, VideoHistory> {
    let path = get_history_path(app);
    if let Ok(content) = fs::read_to_string(path) {
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        HashMap::new()
    }
}

fn write_history(app: &tauri::AppHandle, history: &HashMap<String, VideoHistory>) {
    let path = get_history_path(app);
    if let Ok(content) = serde_json::to_string_pretty(history) {
        let _ = fs::write(path, content);
    }
}

#[tauri::command]
pub async fn save_video_history(
    app: tauri::AppHandle, video_path: String, progress: f64, duration: f64, audio_lang: String, sub_lang: String,
) -> Result<(), String> {
    let real_path = clean_video_path(&video_path);
    let mut history = read_history(&app);
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();

    history.insert(real_path, VideoHistory { progress, duration, audio_lang, sub_lang, last_watched_at: now });
    write_history(&app, &history);
    println!("💾 [HISTORY SAVED] Progress: {}s for {:?}", progress, video_path);
    Ok(())
}

#[tauri::command]
pub async fn get_video_history(app: tauri::AppHandle, video_path: String) -> Result<Option<VideoHistory>, String> {
    let real_path = clean_video_path(&video_path);
    let history = read_history(&app);
    Ok(history.get(&real_path).cloned())
}

#[tauri::command]
pub async fn get_all_history(app: tauri::AppHandle) -> Result<Vec<(String, VideoHistory)>, String> {
    let history = read_history(&app);
    let mut vec: Vec<_> = history.into_iter().collect();
    vec.sort_by(|a, b| b.1.last_watched_at.cmp(&a.1.last_watched_at));
    Ok(vec)
}