use crate::models::{AppState, MediaInfo};
use crate::scanner::scan_directories;
use crate::thumbnail::generate_thumbnail;
use crate::db;
use std::env;
use tauri::State;
use std::path::Path; // 🔥 NAYA IMPORT: Folder path nikalne ke liye
use std::collections::HashMap; // 🔥 NAYA IMPORT: Folders ko group karne ke liye

// 🔥 AutoAlbum ka structure
#[derive(serde::Serialize)]
pub struct AutoAlbum {
    pub id: String,
    pub name: String,
    pub photos: Vec<String>,
}

// 🔥 Background mein scan karke SQLite mein daal dega
#[tauri::command]
pub async fn fetch_synced_images(directories: Vec<String>, state: State<'_, AppState>) -> Result<String, String> {
    let media_list = tauri::async_runtime::spawn_blocking(move || {
        scan_directories(directories)
    }).await.map_err(|e| e.to_string())?;

    // 🔥 FIX: 'conn' ko mut banaya
    let mut conn = state.db.lock().unwrap();
    db::insert_media(&mut conn, media_list).map_err(|e| e.to_string())?;
    
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

// 🔥 NAYA COMMAND: Automatically folders ko albums banayega
#[tauri::command]
pub fn get_auto_albums(state: tauri::State<'_, AppState>) -> Result<Vec<AutoAlbum>, String> {
    let conn = state.db.lock().unwrap();
    // Database se sabhi images/videos ke id aur path (url) uthao
    let mut stmt = conn.prepare("SELECT id, url FROM media").map_err(|e| e.to_string())?;

    let media_iter = stmt.query_map([], |row| {
        let id: String = row.get(0)?;
        let url: String = row.get(1)?;
        Ok((id, url))
    }).map_err(|e| e.to_string())?;

    let mut folder_map: HashMap<String, Vec<String>> = HashMap::new();

    // Har file ka parent folder nikal kar group karo
    for item in media_iter {
        if let Ok((id, url)) = item {
            if let Some(parent) = Path::new(&url).parent() {
                if let Some(folder_name) = parent.file_name().and_then(|n| n.to_str()) {
                    folder_map.entry(folder_name.to_string()).or_insert_with(Vec::new).push(id);
                }
            }
        }
    }

    let mut albums = Vec::new();
    for (name, photos) in folder_map {
        albums.push(AutoAlbum {
            id: format!("auto-album-{}", name), // ID mein prefix taaki manual albums se mix na ho
            name,
            photos,
        });
    }

    // Albums ko A-Z sort kar do
    albums.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(albums)
}