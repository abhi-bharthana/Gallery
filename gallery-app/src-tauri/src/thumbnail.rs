use std::env;
use std::fs;
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn generate_thumbnail(id: &str, original_path: &str, size: u32, is_video: bool) -> Result<String, String> {
    let mut cache_dir = env::temp_dir();
    cache_dir.push("auvem_cache_hq");
    
    if !cache_dir.exists() {
        let _ = fs::create_dir_all(&cache_dir);
    }

    let thumb_path = cache_dir.join(format!("{}_{}.jpg", id, size));
    let thumb_str = thumb_path.to_string_lossy().to_string();

    // Agar cache mein pehle se hai, toh turant wapas do (Zero latency)
    if thumb_path.exists() {
        return Ok(thumb_str);
    }

    if is_video {
        // 🔥 Safe scale filter format (Windows aur Linux dono ke liye stable)
        let scale_filter = format!("scale={}:-2", size);

        let mut cmd = Command::new("ffmpeg");
        cmd.args(&[
            "-y",
            "-v", "error",       // Extra logs hata kar speed badhayega
            "-ss", "00:00:01",   // 1st second par seek karo
            "-i", original_path,
            "-vframes", "1",     // Sirf ek frame extract karo
            "-vf", &scale_filter,
            &thumb_str
        ]);

        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);

        let output = cmd.output().map_err(|e| format!("FFmpeg execution error: {}", e))?;
        
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            eprintln!("⚠️ FFmpeg failed for path [{}]: {}", original_path, stderr);
            return Err(format!("FFmpeg failed: {}", stderr));
        }
        
        Ok(thumb_str)
    } else {
        // Image processing via fast image crate
        let img = image::open(original_path).map_err(|e| format!("Image open error: {}", e))?;
        let thumbnail = img.thumbnail(size, size);
        thumbnail.save(&thumb_path).map_err(|e| format!("Image save error: {}", e))?;
        Ok(thumb_str)
    }
}