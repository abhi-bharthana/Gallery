use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;
use crate::models::AppState;
use crate::media::clean_video_path;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VideoHistory {
    pub progress: f64,
    pub duration: f64,
    pub audio_lang: String,
    pub sub_lang: String,
    pub last_watched_at: u64,
}

#[tauri::command]
pub async fn save_video_history(
    state: State<'_, AppState>, 
    video_path: String, 
    progress: f64, 
    duration: f64, 
    audio_lang: String, 
    sub_lang: String,
) -> Result<(), String> {
    let real_path = clean_video_path(&video_path);
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    
    // Pool se lock-free connection lo
    let conn = state.db_pool.get().map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO video_history (video_path, progress, duration, audio_lang, sub_lang, last_watched_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(video_path) DO UPDATE SET
            progress = excluded.progress,
            duration = excluded.duration,
            audio_lang = excluded.audio_lang,
            sub_lang = excluded.sub_lang,
            last_watched_at = excluded.last_watched_at",
        rusqlite::params![real_path, progress, duration, audio_lang, sub_lang, now as i64],
    ).map_err(|e| format!("History save error: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn get_video_history(state: State<'_, AppState>, video_path: String) -> Result<Option<VideoHistory>, String> {
    let real_path = clean_video_path(&video_path);
    let conn = state.db_pool.get().map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare(
        "SELECT progress, duration, audio_lang, sub_lang, last_watched_at 
         FROM video_history WHERE video_path = ?1"
    ).map_err(|e| e.to_string())?;
    
    let history = stmt.query_row([real_path], |row| {
        Ok(VideoHistory {
            progress: row.get(0)?,
            duration: row.get(1)?,
            audio_lang: row.get(2)?,
            sub_lang: row.get(3)?,
            last_watched_at: row.get::<_, i64>(4)? as u64,
        })
    }).ok();

    Ok(history)
}

#[tauri::command]
pub async fn get_all_history(state: State<'_, AppState>) -> Result<Vec<(String, VideoHistory)>, String> {
    let conn = state.db_pool.get().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT video_path, progress, duration, audio_lang, sub_lang, last_watched_at 
         FROM video_history ORDER BY last_watched_at DESC LIMIT 50"
    ).map_err(|e| e.to_string())?;
    
    let iter = stmt.query_map([], |row| {
        let path: String = row.get(0)?;
        let hist = VideoHistory {
            progress: row.get(1)?,
            duration: row.get(2)?,
            audio_lang: row.get(3)?,
            sub_lang: row.get(4)?,
            last_watched_at: row.get::<_, i64>(5)? as u64,
        };
        Ok((path, hist))
    }).map_err(|e| e.to_string())?;

    let mut vec = Vec::new();
    for item in iter {
        if let Ok(record) = item {
            vec.push(record);
        }
    }
    Ok(vec)
}