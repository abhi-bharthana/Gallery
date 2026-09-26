#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::collections::hash_map::DefaultHasher;
use std::env;
use std::fs;
use std::hash::{Hash, Hasher};
use std::time::UNIX_EPOCH;
use walkdir::WalkDir;

#[derive(Serialize)]
struct ImageInfo {
    id: String,
    url: String,
    timestamp: u64,
    filename: String,
    width: u32,  // 🔥 NAYA: Aspect ratio fix ke liye
    height: u32, // 🔥 NAYA: Aspect ratio fix ke liye
}

#[tauri::command]
async fn get_thumbnail(id: String, original_path: String, size: u32) -> Result<String, String> {
    let mut cache_dir = env::temp_dir();
    cache_dir.push("auvem_cache_hq"); 
    
    if !cache_dir.exists() {
        let _ = fs::create_dir_all(&cache_dir);
    }

    let thumb_path = cache_dir.join(format!("{}_{}.jpg", id, size));
    let thumb_str = thumb_path.to_string_lossy().to_string();

    if thumb_path.exists() {
        return Ok(thumb_str);
    }

    let result = tauri::async_runtime::spawn_blocking(move || -> Result<String, String> {
        let img = image::open(&original_path).map_err(|e| e.to_string())?;
        let thumbnail = img.thumbnail(size, size); 
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

                        // 🔥 MAGIC: Bina image open kiye sirf dimension read kar rahe hain 🔥
                        let (width, height) = image::image_dimensions(&path).unwrap_or((800, 800));

                        if let Some(path_str) = path.to_str() {
                            let normalized_path = path_str.replace("\\", "/");
                            let filename = path.file_name().and_then(|n| n.to_str()).unwrap_or("").to_string();

                            let mut hasher = DefaultHasher::new();
                            normalized_path.hash(&mut hasher);
                            let id = format!("{:016x}", hasher.finish());

                            images.push(ImageInfo {
                                id,
                                url: normalized_path,
                                timestamp,
                                filename,
                                width,   // 🔥 Bheja frontend ko
                                height,  // 🔥 Bheja frontend ko
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

#[tauri::command]
fn get_opened_file() -> Option<String> {
    let args: Vec<String> = env::args().collect();
    if args.len() > 1 && !args[1].starts_with("--") {
        Some(args[1].clone())
    } else {
        None
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![fetch_synced_images, get_thumbnail, get_opened_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}