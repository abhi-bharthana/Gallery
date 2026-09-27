use std::env;
use std::fs;
use tokio::process::Command; 
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use std::time::Duration;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

// 🔥 AAPKA ASYNC GENERATOR
pub async fn generate_thumbnail(id: &str, original_path: &str, size: u32, is_video: bool) -> Result<String, String> {
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

    if is_video {
        let scale_filter = format!("scale={}:-2", size);
        let mut cmd = Command::new("ffmpeg");
        cmd.args(&[
            "-y",
            "-v", "error",       
            "-ss", "00:00:01",   
            "-i", original_path,
            "-vframes", "1",     
            "-vf", &scale_filter,
            &thumb_str
        ]);

        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);

        let output = cmd.output().await.map_err(|e| format!("FFmpeg execution error: {}", e))?;
        
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            eprintln!("⚠️ FFmpeg failed for path [{}]: {}", original_path, stderr);
            return Err(format!("FFmpeg failed: {}", stderr));
        }
        
        Ok(thumb_str)
    } else {
        let path_clone = original_path.to_string();
        let thumb_clone = thumb_path.clone();
        
        let res = tokio::task::spawn_blocking(move || {
            let img = image::open(&path_clone).map_err(|e| format!("Image open error: {}", e))?;
            let thumbnail = img.thumbnail(size, size);
            thumbnail.save(&thumb_clone).map_err(|e| format!("Image save error: {}", e))?;
            Ok::<String, String>(thumb_str)
        }).await.map_err(|e| e.to_string())??;
        
        Ok(res)
    }
}


// 🔥 THE MASTERPIECE: Idle Background Smart Cacher (Fixed with Tauri Runtime)
pub fn start_idle_background_cacher(db_pool: Pool<SqliteConnectionManager>) {
    // 🔥 FIX: tokio::spawn ki jagah tauri::async_runtime::spawn use kiya taaki reactor error na aaye
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(Duration::from_secs(10)).await;
        println!("🤖 [SMART CACHER] Background Thumbnail Engine Started...");

        let mut cache_dir = env::temp_dir();
        cache_dir.push("auvem_cache_hq");
        if !cache_dir.exists() {
            let _ = fs::create_dir_all(&cache_dir);
        }

        let size = 500; 
        let chunk_size = 50; 
        let mut offset = 0;

        loop {
            let mut pending_items = Vec::new();

            if let Ok(conn) = db_pool.get() {
                if let Ok(mut stmt) = conn.prepare("SELECT id, url, media_type FROM media ORDER BY timestamp DESC LIMIT ? OFFSET ?") {
                    if let Ok(rows) = stmt.query_map(rusqlite::params![chunk_size, offset], |row| {
                        let id: String = row.get(0)?;
                        let url: String = row.get(1)?;
                        let media_type: String = row.get(2)?;
                        Ok((id, url, media_type))
                    }) {
                        for item in rows {
                            if let Ok(data) = item {
                                pending_items.push(data);
                            }
                        }
                    }
                }
            }

            if pending_items.is_empty() {
                tokio::time::sleep(Duration::from_secs(60)).await;
                offset = 0; 
                continue;
            }

            for (id, url, media_type) in pending_items {
                let thumb_path = cache_dir.join(format!("{}_{}.jpg", id, size));
                
                if !thumb_path.exists() {
                    let is_video = media_type == "video";
                    let _ = generate_thumbnail(&id, &url, size, is_video).await;
                    tokio::time::sleep(Duration::from_millis(150)).await;
                }
            }

            offset += chunk_size;
            tokio::time::sleep(Duration::from_secs(2)).await;
        }
    });
}