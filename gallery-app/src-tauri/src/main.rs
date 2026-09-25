// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use image::imageops::FilterType;
use serde::Serialize;
use std::collections::hash_map::DefaultHasher;
use std::env;
use std::fs;
use std::hash::{Hash, Hasher};
use std::time::UNIX_EPOCH;
use walkdir::WalkDir;

#[derive(Serialize)]
struct ImageInfo {
    id: String, // Stable hex hash
    url: String,
    timestamp: u64,
    filename: String,
}

// 🔥 THUMBNAIL GENERATOR 🔥
#[tauri::command]
async fn get_thumbnail(id: String, original_path: String) -> Result<String, String> {
    let mut cache_dir = env::temp_dir();
    cache_dir.push("auvem_cache");
    
    if !cache_dir.exists() {
        let _ = fs::create_dir_all(&cache_dir);
    }

    let thumb_path = cache_dir.join(format!("{}.jpg", id));
    let thumb_str = thumb_path.to_string_lossy().to_string();

    if thumb_path.exists() {
        return Ok(thumb_str);
    }

    // 🔥 FIX: Added explicit return type `-> Result<String, String>` to the closure
    let result = tauri::async_runtime::spawn_blocking(move || -> Result<String, String> {
        let img = image::open(&original_path).map_err(|e| e.to_string())?;
        
        let thumbnail = img.resize(400, 400, FilterType::Triangle); 
        
        thumbnail.save(&thumb_path).map_err(|e| e.to_string())?;
        Ok(thumb_str)
    })
    .await
    .map_err(|e| e.to_string())??;

    Ok(result)
}

#[tauri::command]
async fn fetch_synced_images(directories: Vec<String>) -> Result<Vec<ImageInfo>, String> {
    let mut images = Vec::new();

    for dir in directories {
        let walker = WalkDir::new(&dir).into_iter().filter_map(|e| e.ok());

        for entry in walker {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                    let ext_lower = ext.to_lowercase();
                    if matches!(ext_lower.as_str(), "jpg" | "jpeg" | "png" | "webp" | "avif") {
                        let mut timestamp = 0;
                        if let Ok(metadata) = fs::metadata(&path) {
                            if let Ok(modified) = metadata.modified() {
                                if let Ok(duration) = modified.duration_since(UNIX_EPOCH) {
                                    timestamp = duration.as_secs();
                                }
                            }
                        }

                        if let Some(path_str) = path.to_str() {
                            let normalized_path = path_str.replace("\\", "/");
                            let filename = path
                                .file_name()
                                .and_then(|n| n.to_str())
                                .unwrap_or("")
                                .to_string();

                            let mut hasher = DefaultHasher::new();
                            normalized_path.hash(&mut hasher);
                            let id = format!("{:016x}", hasher.finish());

                            images.push(ImageInfo {
                                id,
                                url: normalized_path,
                                timestamp,
                                filename,
                            });
                        }
                    }
                }
            }
        }
    }

    images.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    Ok(images)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![fetch_synced_images, get_thumbnail])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}