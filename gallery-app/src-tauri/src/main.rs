#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod models;
mod scanner;
mod thumbnail;
mod commands;
mod db; 

use models::AppState;
use tokio::sync::Semaphore;
use tauri::Manager;
use std::fs;
use std::sync::Mutex;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        // App start hone se pehle setup block mein Database connect ho raha hai
        .setup(|app| {
            let app_dir = app.path().app_data_dir().unwrap();
            
            if !app_dir.exists() {
                fs::create_dir_all(&app_dir).unwrap();
            }
            
            // Database AppData folder mein secure rahega
            let db_path = app_dir.join("auvem_gallery.db");
            let db_conn = db::init_db(&db_path).expect("Failed to initialize database");

            app.manage(AppState {
                thumbnail_queue: Semaphore::new(4), 
                db: Mutex::new(db_conn), 
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::fetch_synced_images,
            commands::get_filtered_chunk, // 🔥 Updated to match commands.rs
            commands::get_thumbnail,
            commands::get_opened_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}