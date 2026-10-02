// src-tauri/src/vault.rs
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use bcrypt::{hash, DEFAULT_COST};

use aes_gcm::{aead::{Aead, KeyInit}, Aes256Gcm, Nonce};
use crate::models::AppState; 

#[derive(Serialize, Deserialize)]
struct VaultConfig {
    master_hash: String,
    q1_hash: String,
    q2_hash: String,
    q3_hash: String,
    recovery_hash: String,
    windows_hello_enabled: bool,
    face_descriptor: Option<Vec<f32>>,
    
    // 🔥 NAYA: PIN aur Auth Policy
    pin_hash: Option<String>,
    auth_policy: Option<String>, // Options: "pin_only", "face_or_pin", "face_and_pin", "face_and_password", "password_only"
}

// ==========================================
// 🛠️ HELPER FUNCTIONS (Optimized Path Routing)
// ==========================================

// Helper: Get Base Vault Path
fn get_vault_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let mut path = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    path.push("com.auvem.gallery");
    path.push(".auvem_vault");
    Ok(path)
}

// Helper: Get Config File Path
fn get_config_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(get_vault_path(app_handle)?.join("vault_config.json"))
}

// Helper: Bcrypt Hash
fn hash_string(input: &str) -> String {
    hash(input, DEFAULT_COST).unwrap()
}

// ==========================================
// 🛡️ API HANDLERS (Vault Setup & Auth)
// ==========================================

#[tauri::command]
pub fn setup_secure_vault(
    password: &str, q1: &str, a1: &str, q2: &str, a2: &str, q3: &str, a3: &str,
    recovery_key: &str, enable_windows_hello: bool, face_descriptor: Option<Vec<f32>>,
    pin: Option<&str>, auth_policy: Option<&str>, 
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    
    let pin_hash = pin.map(|p| hash_string(p));
    let policy = auth_policy.map(|p| p.to_string()).unwrap_or_else(|| "password_only".to_string());

    let config = VaultConfig {
        master_hash: hash_string(password),
        q1_hash: hash_string(&format!("{}|{}", q1, a1)),
        q2_hash: hash_string(&format!("{}|{}", q2, a2)),
        q3_hash: hash_string(&format!("{}|{}", q3, a3)),
        recovery_hash: hash_string(recovery_key),
        windows_hello_enabled: enable_windows_hello,
        face_descriptor,
        pin_hash,
        auth_policy: Some(policy),
    };

    let vault_path = get_vault_path(&app_handle)?;
    fs::create_dir_all(&vault_path).map_err(|e| e.to_string())?;

    let config_json = serde_json::to_string(&config).map_err(|e| e.to_string())?;
    fs::write(get_config_path(&app_handle)?, config_json).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn is_vault_setup(app_handle: tauri::AppHandle) -> Result<bool, String> {
    Ok(get_config_path(&app_handle)?.exists())
}

#[tauri::command]
pub fn verify_master_password(password: String, app_handle: tauri::AppHandle) -> Result<bool, String> {
    let path = get_config_path(&app_handle)?;
    if !path.exists() { return Ok(false); }
    
    let config: VaultConfig = serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap();
    Ok(bcrypt::verify(&password, &config.master_hash).unwrap_or(false))
}

#[tauri::command]
pub fn verify_recovery_key(recovery_key: String, app_handle: tauri::AppHandle) -> Result<bool, String> {
    let path = get_config_path(&app_handle)?;
    if !path.exists() { return Ok(false); }

    let config: VaultConfig = serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap();
    Ok(bcrypt::verify(&recovery_key.trim(), &config.recovery_hash).unwrap_or(false))
}

#[tauri::command]
pub fn get_vault_face_descriptor(app_handle: tauri::AppHandle) -> Result<Option<Vec<f32>>, String> {
    let path = get_config_path(&app_handle)?;
    if !path.exists() { return Ok(None); }

    let config: VaultConfig = serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap();
    Ok(config.face_descriptor)
}

#[tauri::command]
pub fn update_vault_face_descriptor(face_descriptor: Vec<f32>, app_handle: tauri::AppHandle) -> Result<(), String> {
    let path = get_config_path(&app_handle)?;
    if !path.exists() { return Err("Vault not found".to_string()); }

    let mut config: VaultConfig = serde_json::from_str(&fs::read_to_string(&path).unwrap()).unwrap();
    config.face_descriptor = Some(face_descriptor);
    
    fs::write(path, serde_json::to_string(&config).unwrap()).map_err(|e| e.to_string())?;
    Ok(())
}

// 🔥 NAYA: Update PIN
#[tauri::command]
pub fn update_vault_pin(pin: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let path = get_config_path(&app_handle)?;
    if !path.exists() { return Err("Vault not found".to_string()); }

    let mut config: VaultConfig = serde_json::from_str(&fs::read_to_string(&path).unwrap()).unwrap();
    config.pin_hash = Some(hash_string(&pin));
    
    fs::write(path, serde_json::to_string(&config).unwrap()).map_err(|e| e.to_string())?;
    Ok(())
}

// 🔥 NAYA: Update Auth Policy
#[tauri::command]
pub fn update_auth_policy(policy: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let path = get_config_path(&app_handle)?;
    if !path.exists() { return Err("Vault not found".to_string()); }

    let mut config: VaultConfig = serde_json::from_str(&fs::read_to_string(&path).unwrap()).unwrap();
    config.auth_policy = Some(policy);
    
    fs::write(path, serde_json::to_string(&config).unwrap()).map_err(|e| e.to_string())?;
    Ok(())
}

// 🔥 NAYA: Verify PIN
#[tauri::command]
pub fn verify_vault_pin(pin: String, app_handle: tauri::AppHandle) -> Result<bool, String> {
    let path = get_config_path(&app_handle)?;
    if !path.exists() { return Ok(false); }
    
    let config: VaultConfig = serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap();
    
    if let Some(pin_hash) = config.pin_hash {
        Ok(bcrypt::verify(&pin, &pin_hash).unwrap_or(false))
    } else {
        Ok(false)
    }
}

// 🔥 NAYA: Get Auth Policy
#[tauri::command]
pub fn get_auth_policy(app_handle: tauri::AppHandle) -> Result<String, String> {
    let path = get_config_path(&app_handle)?;
    if !path.exists() { return Ok("password_only".to_string()); }
    
    let config: VaultConfig = serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap();
    Ok(config.auth_policy.unwrap_or_else(|| "password_only".to_string()))
}


// ==========================================
// 📦 AES-256 FILE ENCRYPTION & RELOCATION
// ==========================================

fn uuid_v4_short() -> String {
    let bytes: [u8; 4] = rand::random();
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}


#[tauri::command]
pub async fn encrypt_and_lock_file(
    file_path: String, 
    app_handle: tauri::AppHandle, 
    state: tauri::State<'_, AppState>
) -> Result<String, String> {
    let src_path = std::path::Path::new(&file_path);
    if !src_path.exists() { return Err("File not found.".to_string()); }

    let plaintext = fs::read(src_path).map_err(|e| e.to_string())?;

    let media_dir = get_vault_path(&app_handle)?.join("media");
    fs::create_dir_all(&media_dir).map_err(|e| e.to_string())?;

    let file_stem = src_path.file_stem().unwrap_or_default().to_string_lossy();
    let dest_path = media_dir.join(format!("{}_{}.enc", file_stem, uuid_v4_short()));

    let config_path = get_config_path(&app_handle)?;
    let config_data = fs::read_to_string(config_path).map_err(|e| e.to_string())?;
    let config: VaultConfig = serde_json::from_str(&config_data).map_err(|e| e.to_string())?;

    let mut key = [0u8; 32];
    for (i, &byte) in config.master_hash.as_bytes().iter().cycle().take(32).enumerate() { 
        key[i] = byte; 
    }

    let cipher_key = aes_gcm::Key::<Aes256Gcm>::try_from(key.as_slice()).unwrap();
    let cipher = Aes256Gcm::new(&cipher_key);

    let nonce_bytes: [u8; 12] = rand::random();
    let nonce = Nonce::try_from(nonce_bytes.as_slice()).unwrap();
    let ciphertext = cipher.encrypt(&nonce, plaintext.as_ref()).map_err(|e| e.to_string())?;

    let mut final_data = nonce_bytes.to_vec();
    final_data.extend(ciphertext);
    
    fs::write(&dest_path, final_data).map_err(|e| e.to_string())?;
    fs::remove_file(src_path).map_err(|e| e.to_string())?; 

    let encrypted_path_str = dest_path.to_string_lossy().into_owned();
    
    let conn = state.db_pool.get().map_err(|e| format!("DB Error: {}", e))?;
    conn.execute(
        "UPDATE media SET is_vaulted = 1, vault_path = ?1 WHERE url = ?2",
        rusqlite::params![encrypted_path_str, file_path],
    ).map_err(|e| format!("Failed to update DB: {}", e))?;

    Ok(encrypted_path_str)
}

#[tauri::command]
pub async fn decrypt_and_unlock_file(
    id: String,
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, AppState>
) -> Result<String, String> {
    let conn = state.db_pool.get().map_err(|e| format!("DB Error: {}", e))?;

    // 1. Original URL aur Vault Path DB se nikalo
    let (original_url, vault_path): (String, String) = conn.query_row(
        "SELECT url, vault_path FROM media WHERE id = ?1 AND is_vaulted = 1",
        rusqlite::params![id],
        |row| Ok((row.get(0)?, row.get(1)?))
    ).map_err(|_| "File not found in vault".to_string())?;

    let v_path = std::path::Path::new(&vault_path);
    if !v_path.exists() { return Err("Encrypted file missing from disk.".to_string()); }

    // 2. Encryption Key Setup
    let config_path = get_config_path(&app_handle)?;
    let config_data = fs::read_to_string(config_path).map_err(|e| e.to_string())?;
    let config: VaultConfig = serde_json::from_str(&config_data).map_err(|e| e.to_string())?;

    let mut key = [0u8; 32];
    for (i, &byte) in config.master_hash.as_bytes().iter().cycle().take(32).enumerate() {
        key[i] = byte;
    }

    // 3. Read and Decrypt
    let encrypted_data = fs::read(v_path).map_err(|e| e.to_string())?;
    if encrypted_data.len() < 12 { return Err("Invalid encrypted file".to_string()); }

    let (nonce_bytes, ciphertext) = encrypted_data.split_at(12);
    let cipher_key = aes_gcm::Key::<Aes256Gcm>::try_from(key.as_slice()).unwrap();
    let cipher = Aes256Gcm::new(&cipher_key);
    let nonce = Nonce::try_from(nonce_bytes).unwrap();

    let plaintext = cipher.decrypt(&nonce, ciphertext).map_err(|e| format!("Decryption failed: {}", e))?;

    // 🔥 MAIN FIX: Folder recreate karna agar accidentally delete ho gaya ho 
    if let Some(parent) = std::path::Path::new(&original_url).parent() {
        let _ = fs::create_dir_all(parent);
    }

    // 4. Save back to original path & Delete Vault file
    fs::write(&original_url, plaintext).map_err(|e| format!("Failed to restore file: {}", e))?;
    fs::remove_file(v_path).map_err(|e| e.to_string())?;

    // 5. Update Database to un-vault it
    conn.execute(
        "UPDATE media SET is_vaulted = 0, vault_path = '' WHERE id = ?1",
        rusqlite::params![id],
    ).map_err(|e| format!("Failed to update DB: {}", e))?;

    Ok(original_url)
}