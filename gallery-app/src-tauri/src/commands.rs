// src-tauri/src/commands.rs
use crate::models::{AppState, MediaInfo};
use crate::scanner::scan_directories;
use crate::thumbnail::generate_thumbnail;
use crate::db;
use std::env;
use tauri::State;
use std::path::Path; 
use std::collections::HashMap; 

#[derive(serde::Serialize)]
pub struct AutoAlbum {
    pub id: String,
    pub name: String,
    pub photos: Vec<String>,
}

#[tauri::command]
pub async fn fetch_synced_images(directories: Vec<String>, state: State<'_, AppState>) -> Result<String, String> {
    let media_list = tauri::async_runtime::spawn_blocking(move || {
        scan_directories(directories)
    }).await.map_err(|e| e.to_string())?;

    let mut conn = state.db_pool.get().map_err(|e| e.to_string())?;
    db::insert_media(&mut conn, media_list).map_err(|e| e.to_string())?;
    
    Ok("Sync Complete".to_string())
}

// 🔥 UPGRADED: Ab frontend batayega ki Ghost Mode ON hai ya OFF
#[tauri::command]
pub fn get_filtered_chunk(
    tab: String, 
    search: String, 
    sort_by: String, 
    limit: u32, 
    offset: u32, 
    is_ghost_mode: bool, // 🛡️ NAYA PARAMETER
    state: State<'_, AppState>
) -> Result<Vec<MediaInfo>, String> {
    let conn = state.db_pool.get().map_err(|e| e.to_string())?;
    db::get_filtered_media(&conn, &tab, &search, &sort_by, limit, offset, is_ghost_mode).map_err(|e| e.to_string())
}

// 🔥 NAYA COMMAND: React se kill signal receive karega aur backend task abort karega
#[tauri::command]
pub fn cancel_thumbnail(id: String, state: State<'_, AppState>) {
    let mut tasks = state.active_thumb_tasks.lock().unwrap();
    if let Some(kill_switch) = tasks.remove(&id) {
        let _ = kill_switch.send(()); 
    }
}

// 🔥 SMART COMMAND: Ab yeh thumbnail generator cancel-aware hai!
#[tauri::command]
pub async fn get_thumbnail(id: String, original_path: String, size: u32, state: State<'_, AppState>) -> Result<String, String> {
    let (tx, mut rx) = tokio::sync::oneshot::channel::<()>();
    
    {
        let mut tasks = state.active_thumb_tasks.lock().unwrap();
        tasks.insert(id.clone(), tx);
    }

    let _permit = state.thumbnail_queue.acquire().await.map_err(|e| e.to_string())?;
    let path_lower = original_path.to_lowercase();
    let is_video = path_lower.ends_with(".mp4") || path_lower.ends_with(".mkv") || path_lower.ends_with(".mov") || path_lower.ends_with(".webm") || path_lower.ends_with(".hevc");

    tokio::select! {
        res = generate_thumbnail(&id, &original_path, size, is_video) => {
            let mut tasks = state.active_thumb_tasks.lock().unwrap();
            tasks.remove(&id);
            res
        }
        _ = &mut rx => {
            Err("Task cancelled by frontend".to_string())
        }
    }
}

#[tauri::command]
pub fn get_opened_file() -> Option<String> {
    let args: Vec<String> = env::args().collect();
    if args.len() > 1 && !args[1].starts_with("--") { Some(args[1].clone()) } else { None }
}

// 🔥 UPGRADED: Ab Albums mein bhi hidden photos nahi dikhengi jab tak Ghost Mode ON na ho!
#[tauri::command]
pub fn get_auto_albums(is_ghost_mode: bool, state: tauri::State<'_, AppState>) -> Result<Vec<AutoAlbum>, String> {
    let conn = state.db_pool.get().map_err(|e| e.to_string())?;
    
    // 🛡️ Security Check
    let query = if is_ghost_mode {
        "SELECT id, url FROM media" // Sab dikhao
    } else {
        "SELECT id, url FROM media WHERE is_vaulted = 0" // Sirf un-hidden dikhao
    };

    let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;

    let media_iter = stmt.query_map([], |row| {
        let id: String = row.get(0)?;
        let url: String = row.get(1)?;
        Ok((id, url))
    }).map_err(|e| e.to_string())?;

    let mut folder_map: HashMap<String, Vec<String>> = HashMap::new();

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
            id: format!("auto-album-{}", name), 
            name,
            photos,
        });
    }

    albums.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(albums)
}