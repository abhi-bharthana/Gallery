use crate::models::MediaInfo;
use std::collections::hash_map::DefaultHasher;
use std::fs;
use std::hash::{Hash, Hasher};
use std::time::UNIX_EPOCH;
use walkdir::WalkDir;

pub fn scan_directories(directories: Vec<String>) -> Vec<MediaInfo> {
    let mut media_list = Vec::new();

    for dir in directories {
        let walker = WalkDir::new(&dir).into_iter().filter_map(|e| e.ok());

        for entry in walker {
            let path = entry.path();
            if !path.is_file() { continue; }

            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                let ext_lower = ext.to_lowercase();
                let is_image = matches!(ext_lower.as_str(), "jpg" | "jpeg" | "png" | "webp" | "avif");
                let is_video = matches!(ext_lower.as_str(), "mp4" | "mkv" | "mov" | "webm" | "hevc");

                if is_image || is_video {
                    let mut timestamp = 0;
                    if let Ok(metadata) = fs::metadata(&path) {
                        if let Ok(modified) = metadata.modified() {
                            if let Ok(duration) = modified.duration_since(UNIX_EPOCH) {
                                timestamp = duration.as_secs();
                            }
                        }
                    }

                    // Videos ke liye default 1920x1080 rakha hai taaki heavy ffprobe scan bach sake
                    let (width, height) = if is_image {
                        image::image_dimensions(&path).unwrap_or((800, 800))
                    } else {
                        (1920, 1080)
                    };

                    let media_type = if is_video { "video".to_string() } else { "image".to_string() };

                    if let Some(path_str) = path.to_str() {
                        let normalized_path = path_str.replace("\\", "/");
                        let filename = path.file_name().and_then(|n| n.to_str()).unwrap_or("").to_string();

                        let mut hasher = DefaultHasher::new();
                        normalized_path.hash(&mut hasher);
                        let id = format!("{:016x}", hasher.finish());

                        media_list.push(MediaInfo {
                            id,
                            url: normalized_path,
                            timestamp,
                            filename,
                            width,
                            height,
                            media_type,
                        });
                    }
                }
            }
        }
    }
    media_list.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    media_list
}