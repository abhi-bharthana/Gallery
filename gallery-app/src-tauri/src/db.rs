use rusqlite::{params, Connection, Result};
use crate::models::MediaInfo;
use std::path::PathBuf;

pub fn init_db(db_path: &PathBuf) -> Result<Connection> {
    let conn = Connection::open(db_path)?;
    conn.execute_batch("
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA temp_store = MEMORY;
        
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
    ")?;
    Ok(conn)
}

pub fn insert_media(conn: &mut Connection, media_list: Vec<MediaInfo>) -> Result<()> {
    let tx = conn.transaction()?;
    {
        let mut stmt = tx.prepare_cached(
            "INSERT INTO media (id, url, timestamp, filename, width, height, media_type, file_size)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
             ON CONFLICT(id) DO UPDATE SET
                timestamp = excluded.timestamp,
                filename = excluded.filename,
                file_size = excluded.file_size"
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
                media.file_size as i64 // 🔥 FIX: i64 cast
            ])?;
        }
    }
    tx.commit()?;
    Ok(())
}

pub fn get_filtered_media(
    conn: &Connection, 
    _tab: &str, 
    search: &str, 
    limit: u32, 
    offset: u32
) -> Result<Vec<MediaInfo>> {
    let mut query = String::from("SELECT id, url, timestamp, filename, width, height, media_type, file_size FROM media WHERE 1=1");
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if !search.is_empty() {
        query.push_str(" AND filename LIKE ?");
        params_vec.push(Box::new(format!("%{}%", search)));
    }

    query.push_str(" ORDER BY timestamp DESC LIMIT ? OFFSET ?");
    params_vec.push(Box::new(limit));
    params_vec.push(Box::new(offset));

    let mut stmt = conn.prepare(&query)?;
    let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| &**p).collect();

    let media_iter = stmt.query_map(&params_refs[..], |row| {
        let ts: i64 = row.get(2)?;
        let f_size: i64 = row.get(7).unwrap_or(0); // 🔥 FIX: i64 read
        Ok(MediaInfo {
            id: row.get(0)?,
            url: row.get(1)?,
            timestamp: ts as u64,
            filename: row.get(3)?,
            width: row.get(4)?,
            height: row.get(5)?,
            media_type: row.get(6)?,
            file_size: f_size as u64, // 🔥 FIX: u64 cast
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