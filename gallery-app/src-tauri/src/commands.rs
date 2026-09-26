use crate::models::{AppState, MediaInfo};
use crate::scanner::scan_directories;
use crate::thumbnail::generate_thumbnail;
use crate::db;
use std::env;
use tauri::State;

// 🔥 Background mein scan karke SQLite mein daal dega
#[tauri::command]
pub async fn fetch_synced_images(directories: Vec<String>, state: State<'_, AppState>) -> Result<String, String> {
    let media_list = tauri::async_runtime::spawn_blocking(move || {
        scan_directories(directories)
    }).await.map_err(|e| e.to_string())?;

    let conn = state.db.lock().unwrap();
    db::insert_media(&conn, media_list).map_err(|e| e.to_string())?;
    
    Ok("Sync Complete".to_string())
}

// 🔥 NAYA COMMAND: Smart DB Pagination with Search & Filters
#[tauri::command]
pub fn get_filtered_chunk(
    tab: String, 
    search: String, 
    limit: u32, 
    offset: u32, 
    state: State<'_, AppState>
) -> Result<Vec<MediaInfo>, String> {
    let conn = state.db.lock().unwrap();
    db::get_filtered_media(&conn, &tab, &search, limit, offset).map_err(|e| e.to_string())
}

// 🔥 Thumbnail Generator with Queue Processing
#[tauri::command]
pub async fn get_thumbnail(id: String, original_path: String, size: u32, state: State<'_, AppState>) -> Result<String, String> {
    let _permit = state.thumbnail_queue.acquire().await.map_err(|e| e.to_string())?;
    let path_lower = original_path.to_lowercase();
    let is_video = path_lower.ends_with(".mp4") || path_lower.ends_with(".mkv") || path_lower.ends_with(".mov") || path_lower.ends_with(".webm") || path_lower.ends_with(".hevc");

    let result = tauri::async_runtime::spawn_blocking(move || {
        generate_thumbnail(&id, &original_path, size, is_video)
    }).await.map_err(|e| e.to_string())??;

    Ok(result)
}

// 🔥 OS System File Opener Handler
#[tauri::command]
pub fn get_opened_file() -> Option<String> {
    let args: Vec<String> = env::args().collect();
    if args.len() > 1 && !args[1].starts_with("--") { Some(args[1].clone()) } else { None }
}