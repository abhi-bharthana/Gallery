use serde::Serialize;
use tokio::sync::Semaphore;
use rusqlite::Connection;
use std::sync::Mutex; // Thread-safe state ke liye

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
}

pub struct AppState {
    pub thumbnail_queue: Semaphore,
    pub db: Mutex<Connection>, // 🔥 NAYA: Database connection state
}