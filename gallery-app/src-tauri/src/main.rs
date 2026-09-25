#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::fs;
use std::time::UNIX_EPOCH;
use walkdir::WalkDir;

// Ab hum sirf string nahi, proper object bhejenge
#[derive(Serialize)]
struct ImageInfo {
    url: String,
    timestamp: u64, // Image ki date (seconds me)
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
                        
                        // OS se image ki last modified date nikal rahe hain
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
                            images.push(ImageInfo {
                                url: normalized_path,
                                timestamp,
                            });
                        }
                    }
                }
            }
        }
    }

    // Sort: Sabse nayi photos sabse upar (Descending order)
    images.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    Ok(images)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![fetch_synced_images])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}