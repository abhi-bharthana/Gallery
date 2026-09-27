#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod models;
mod scanner;
mod thumbnail;
mod commands;
mod db; 

// 🔥 Naye Modules connect kiye hain
mod media;
mod history;
mod server;

use models::AppState;
use tokio::sync::Semaphore;
use tauri::Manager;
use std::fs;
use std::sync::{Mutex, Arc};
use std::collections::HashMap;

fn main() {
    let media_state = Arc::new(media::MediaStreamState {
        current_path: Mutex::new("".into()),
        audio_index: Mutex::new(1),
    });

    // 🔥 Server start external module se!
    server::start_streaming_server(media_state.clone());

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(media_state)
        .setup(|app| {
            let app_dir = app.path().app_data_dir().unwrap();
            
            if !app_dir.exists() {
                fs::create_dir_all(&app_dir).unwrap();
            }
            
            let db_path = app_dir.join("auvem_v2.db");
            
            let db_pool = db::init_db(&db_path).expect("Failed to initialize database");

            // 🔥 THE MASTERPIECE: Background Cacher Daemon Start!
            // Yeh app start hone ke 10 sec baad background mein saare thumbnails pre-cache karega.
            thumbnail::start_idle_background_cacher(db_pool.clone());

            app.manage(AppState {
                thumbnail_queue: Semaphore::new(4), 
                db_pool, 
                active_thumb_tasks: Mutex::new(HashMap::new()), 
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::fetch_synced_images,
            commands::get_filtered_chunk, 
            commands::get_thumbnail,
            commands::cancel_thumbnail,
            commands::get_opened_file,
            commands::get_auto_albums,
            
            // 🔥 Modularized Handlers
            media::get_video_tracks,
            media::extract_subtitle_vtt,
            media::set_active_media_stream,
            
            history::save_video_history,
            history::get_video_history,
            history::get_all_history
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}