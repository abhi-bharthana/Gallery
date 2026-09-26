use rusqlite::{params, Connection, Result};
use crate::models::MediaInfo;
use std::path::PathBuf;

// 🔥 1. Database Initialization
pub fn init_db(db_path: &PathBuf) -> Result<Connection> {
    let conn = Connection::open(db_path)?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS media (
            id TEXT PRIMARY KEY,
            url TEXT UNIQUE,
            timestamp INTEGER,
            filename TEXT,
            width INTEGER,
            height INTEGER,
            media_type TEXT
        )",
        [],
    )?;
    Ok(conn)
}

// 🔥 2. Fast Bulk Insert
// 🔥 Fast Bulk Insert & Auto-Cleanup of Removed Folders
pub fn insert_media(conn: &Connection, media_list: Vec<MediaInfo>) -> Result<()> {
    // 1. Purana sara data uda do taaki jo folder delete ho chuke hain, wo DB mein na bachein
    conn.execute("DELETE FROM media", [])?;

    // 2. Naya fresh data insert karo
    let mut stmt = conn.prepare(
        "INSERT OR IGNORE INTO media (id, url, timestamp, filename, width, height, media_type)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
    )?;
    
    for media in media_list {
        stmt.execute(params![
            media.id,
            media.url,
            media.timestamp as i64,
            media.filename,
            media.width,
            media.height,
            media.media_type
        ])?;
    }
    Ok(())
}

// 🔥 3. Filtered & Paginated Media Fetch
pub fn get_filtered_media(
    conn: &Connection, 
    _tab: &str, // Prefix with underscore to prevent unused variable warning
    search: &str, 
    limit: u32, 
    offset: u32
) -> Result<Vec<MediaInfo>> {
    let mut query = String::from("SELECT id, url, timestamp, filename, width, height, media_type FROM media WHERE 1=1");
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    // 1. Search Query Filter
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
        Ok(MediaInfo {
            id: row.get(0)?,
            url: row.get(1)?,
            timestamp: ts as u64,
            filename: row.get(3)?,
            width: row.get(4)?,
            height: row.get(5)?,
            media_type: row.get(6)?,
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