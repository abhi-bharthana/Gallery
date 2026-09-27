use serde::Serialize;
use tokio::sync::Semaphore;
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use std::collections::HashMap;
use std::sync::Mutex; // 🔥 NAYA IMPORT

#[derive(Serialize)]
pub struct MediaInfo {
    pub id: String,
    pub url: String,
    pub timestamp: u64,
    pub filename: String,
    pub width: u32,
    pub height: u32,
    #[serde(rename = "type")]
    pub media_type: String,
    pub file_size: u64, 
}

pub struct AppState {
    pub thumbnail_queue: Semaphore,
    pub db_pool: Pool<SqliteConnectionManager>, 
    // 🔥 THE MASTER FIX: Active tasks ke "Kill Switches" yahan store honge
    pub active_thumb_tasks: Mutex<HashMap<String, tokio::sync::oneshot::Sender<()>>>,
}