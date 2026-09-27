use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::{params, Connection, Result};
use crate::models::MediaInfo;
use std::path::PathBuf;
use std::collections::HashSet; 

pub fn init_db(db_path: &PathBuf) -> Result<Pool<SqliteConnectionManager>, rusqlite::Error> {
    let manager = SqliteConnectionManager::file(db_path)
        .with_init(|c| {
            c.execute_batch("
                PRAGMA journal_mode = WAL;
                PRAGMA synchronous = NORMAL;
                PRAGMA temp_store = MEMORY;
                PRAGMA busy_timeout = 5000; 
            ")
        });
    
    let pool = Pool::builder()
        .max_size(5)
        .build(manager)
        .expect("Failed to create db pool");

    let conn = pool.get().expect("Failed to get DB connection from pool");
    
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS media (
            id TEXT PRIMARY KEY,
            url TEXT UNIQUE,
            timestamp INTEGER,
            filename TEXT,
            width INTEGER,
            height INTEGER,
            media_type TEXT,
            file_size INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_media_timestamp ON media(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_media_filename ON media(filename);
        
        CREATE TABLE IF NOT EXISTS video_history (
            video_path TEXT PRIMARY KEY,
            progress REAL,
            duration REAL,
            audio_lang TEXT,
            sub_lang TEXT,
            last_watched_at INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_history_time ON video_history(last_watched_at DESC);
    ")?;

    // 🔥 THE MASTER FIX: Smart Schema Migration 🔥
    // Agar user ke paas purana DB hai, toh yeh silently naye columns add karega
    // let _ = ... likhne se agar column pehle se hoga toh error ignore ho jayega aur app crash nahi hogi
    let _ = conn.execute("ALTER TABLE media ADD COLUMN width INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE media ADD COLUMN height INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE media ADD COLUMN file_size INTEGER DEFAULT 0", []);

    Ok(pool)
}

// 🔥 Smart Two-Way Sync (Add, Update & Delete)
pub fn insert_media(conn: &mut Connection, media_list: Vec<MediaInfo>) -> Result<()> {
    let tx = conn.transaction()?;
    
    let valid_ids: HashSet<String> = media_list.iter().map(|m| m.id.clone()).collect();
    
    {
        let mut stmt = tx.prepare_cached(
            "INSERT INTO media (id, url, timestamp, filename, width, height, media_type, file_size)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
             ON CONFLICT(id) DO UPDATE SET
                timestamp = excluded.timestamp,
                filename = excluded.filename,
                file_size = excluded.file_size,
                width = excluded.width,
                height = excluded.height"
        )?;

        for media in &media_list {
            stmt.execute(params![
                media.id,
                media.url,
                media.timestamp as i64,
                media.filename,
                media.width,
                media.height,
                media.media_type,
                media.file_size as i64 
            ])?;
        }
    }
    
    // 🔥 STALE DATA CLEANUP LOGIC 🔥
    {
        let mut stmt = tx.prepare("SELECT id FROM media")?;
        let db_ids_iter = stmt.query_map([], |row| row.get::<_, String>(0))?;
        
        let mut ids_to_delete = Vec::new();
        for id_res in db_ids_iter {
            if let Ok(id) = id_res {
                if !valid_ids.contains(&id) {
                    ids_to_delete.push(id);
                }
            }
        }
        
        let mut del_stmt = tx.prepare_cached("DELETE FROM media WHERE id = ?1")?;
        for id in ids_to_delete {
            del_stmt.execute(params![id])?;
        }
    }

    tx.commit()?;
    Ok(())
}

pub fn get_filtered_media(
    conn: &Connection, 
    _tab: &str, 
    search: &str, 
    sort_by: &str, 
    limit: u32, 
    offset: u32
) -> Result<Vec<MediaInfo>> {
    let mut query = String::from("SELECT id, url, timestamp, filename, width, height, media_type, file_size FROM media WHERE 1=1");
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if !search.is_empty() {
        query.push_str(" AND filename LIKE ?");
        params_vec.push(Box::new(format!("%{}%", search)));
    }

    match sort_by {
        "time_asc" => query.push_str(" ORDER BY timestamp ASC"),
        "name_asc" => query.push_str(" ORDER BY filename COLLATE NOCASE ASC"),
        "size_desc" => query.push_str(" ORDER BY file_size DESC"),
        _ => query.push_str(" ORDER BY timestamp DESC"),
    }

    query.push_str(" LIMIT ? OFFSET ?");
    params_vec.push(Box::new(limit));
    params_vec.push(Box::new(offset));

    let mut stmt = conn.prepare(&query)?;
    let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| &**p).collect();

    let media_iter = stmt.query_map(&params_refs[..], |row| {
        let ts: i64 = row.get(2)?;
        let f_size: i64 = row.get(7).unwrap_or(0); 
        Ok(MediaInfo {
            id: row.get(0)?,
            url: row.get(1)?,
            timestamp: ts as u64,
            filename: row.get(3)?,
            width: row.get(4)?,
            height: row.get(5)?,
            media_type: row.get(6)?,
            file_size: f_size as u64, 
        })
    })?;

    let mut result = Vec::new();
    for media in media_iter {
        if let Ok(m) = media {
            result.push(m);
        }
    }
    Ok(result)
}