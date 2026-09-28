// src-tauri/src/scanner.rs
use crate::models::MediaInfo;
use std::fs;
use std::time::UNIX_EPOCH;
use walkdir::WalkDir;
use std::hash::Hasher;
use twox_hash::XxHash64;
use std::process::Command; 

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn scan_directories(directories: Vec<String>) -> Vec<MediaInfo> {
    let mut media_list = Vec::new();

    for dir in directories {
        let walker = WalkDir::new(&dir).into_iter().filter_map(|e| e.ok());

        for entry in walker {
            let path = entry.path();
            if !path.is_file() { continue; }

            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                let ext_lower = ext.to_lowercase();
                
                let is_image = matches!(ext_lower.as_str(), "jpg" | "jpeg" | "png" | "webp" | "avif" | "gif" | "bmp" | "heic" | "heif");
                let is_video = matches!(ext_lower.as_str(), "mp4" | "mkv" | "mov" | "webm" | "hevc");

                if is_image || is_video {
                    let mut timestamp = 0;
                    let mut file_size = 0; 

                    if let Ok(metadata) = fs::metadata(&path) {
                        file_size = metadata.len(); 
                        if let Ok(modified) = metadata.modified() {
                            if let Ok(duration) = modified.duration_since(UNIX_EPOCH) {
                                timestamp = duration.as_secs();
                            }
                        }
                    }

                    let mut width = 0;
                    let mut height = 0;

                    if is_image {
                        if let Ok((w, h)) = image::image_dimensions(&path) {
                            width = w as u32;
                            height = h as u32;
                        }
                    } else if is_video {
                        let mut cmd = Command::new("ffprobe");
                        cmd.args([
                            "-v", "error", 
                            "-select_streams", "v:0", 
                            "-show_entries", "stream=width,height", 
                            "-of", "csv=s=x:p=0", 
                            path.to_str().unwrap_or("")
                        ]);

                        #[cfg(target_os = "windows")]
                        cmd.creation_flags(CREATE_NO_WINDOW);

                        if let Ok(output) = cmd.output() {
                            let dim_str = String::from_utf8_lossy(&output.stdout);
                            let parts: Vec<&str> = dim_str.trim().split('x').collect();
                            if parts.len() == 2 {
                                width = parts[0].parse().unwrap_or(0);
                                height = parts[1].parse().unwrap_or(0);
                            }
                        }
                    }

                    let media_type = if is_video { "video".to_string() } else { "image".to_string() };

                    if let Some(path_str) = path.to_str() {
                        let normalized_path = path_str.replace("\\", "/");
                        let filename = path.file_name().and_then(|n| n.to_str()).unwrap_or("").to_string();

                        let mut hasher = XxHash64::default();
                        hasher.write(normalized_path.as_bytes());
                        let id = format!("{:016x}", hasher.finish());

                        media_list.push(MediaInfo {
                            id,
                            url: normalized_path,
                            timestamp,
                            filename,
                            width, 
                            height,
                            media_type,
                            file_size,
                            vault_path: None, // 🔥 ERROR FIX: Scanner me initially file vault me nahi hoti hai
                        });
                    }
                }
            }
        }
    }
    
    media_list.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    media_list
}