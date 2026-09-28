// src-tauri/src/main.rs
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
mod vault; // 🔥 Secure Vault ke liye

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

    // 🔥 media_state ka ek clone banaya taaki setup() thread mein bhej sakein
    let media_state_for_server = media_state.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(media_state)
        .setup(move |app| { // 🔥 'move' lagana zaroori hai
            let app_dir = app.path().app_data_dir().unwrap();
            
            if !app_dir.exists() {
                fs::create_dir_all(&app_dir).unwrap();
            }

            // 🔥 NAYA: Server ko setup ke andar start kiya taaki AppHandle mil sake
            server::start_streaming_server(media_state_for_server, app.handle().clone());
            
            let db_path = app_dir.join("auvem_v2.db");
            
            let db_pool = db::init_db(&db_path).expect("Failed to initialize database");

            // 🔥 THE MASTERPIECE: Background Cacher Daemon Start!
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
            history::get_all_history,

            // 🔥 Vault Handlers (Updated with PIN & Auth Policy)
            vault::setup_secure_vault,
            vault::is_vault_setup,
            vault::verify_master_password,
            vault::verify_recovery_key,
            vault::get_vault_face_descriptor,
            vault::encrypt_and_lock_file,
            vault::update_vault_face_descriptor,
            vault::update_vault_pin,       // 🔥 NAYA
            vault::update_auth_policy,     // 🔥 NAYA
            vault::verify_vault_pin,       // 🔥 NAYA
            vault::get_auth_policy         // 🔥 NAYA
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}