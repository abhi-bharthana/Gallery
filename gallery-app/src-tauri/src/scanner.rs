use crate::models::MediaInfo;
use std::fs;
use std::time::UNIX_EPOCH;
use walkdir::WalkDir;
use std::hash::Hasher;
use twox_hash::XxHash64;

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
                    let mut file_size = 0; // 🔥 FIX: SIZE KA VARIABLE ADD KIYA

                    if let Ok(metadata) = fs::metadata(&path) {
                        file_size = metadata.len(); // 🔥 FIX: FILE SIZE BYTES MEIN EXTRACT KIYA
                        if let Ok(modified) = metadata.modified() {
                            if let Ok(duration) = modified.duration_since(UNIX_EPOCH) {
                                timestamp = duration.as_secs();
                            }
                        }
                    }

                    // 🔥 FIX: Disk IO bachane ke liye dimensions yahan extract nahi karenge.
                    let width = 0;
                    let height = 0;
                    let media_type = if is_video { "video".to_string() } else { "image".to_string() };

                    if let Some(path_str) = path.to_str() {
                        let normalized_path = path_str.replace("\\", "/");
                        let filename = path.file_name().and_then(|n| n.to_str()).unwrap_or("").to_string();

                        // 🔥 FIX: Hamesha same file ke liye same ID banegi
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
                            file_size, // 🔥 FIX: PUSH MEIN ADD KIYA
                        });
                    }
                }
            }
        }
    }
    media_list.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    media_list
}