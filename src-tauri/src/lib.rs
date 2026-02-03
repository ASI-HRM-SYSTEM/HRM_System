use rusqlite::{Connection, Result as SqliteResult};
use std::sync::Mutex;
use tauri::Manager;

pub mod commands;
pub mod models;

pub struct DbConnection(pub Mutex<Connection>);

pub fn init_db(app_handle: &tauri::AppHandle) -> SqliteResult<Connection> {
    let app_dir = match app_handle.path().app_data_dir() {
        Ok(dir) => dir,
        Err(e) => {
            eprintln!("Failed to get app data directory: {:?}", e);
            // Fallback to current directory
            std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."))
        }
    };
    
    if let Err(e) = std::fs::create_dir_all(&app_dir) {
        eprintln!("Failed to create app data directory: {:?}", e);
    }
    
    let db_path = app_dir.join("hrm_system.db");
    eprintln!("Database path: {:?}", db_path);
    
    let conn = Connection::open(&db_path)?;
    
    // Create employees table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS employees (
            epf_number TEXT PRIMARY KEY,
            name_with_initials TEXT NOT NULL,
            full_name TEXT NOT NULL,
            dob TEXT,
            police_area TEXT,
            transport_route TEXT,
            mobile_1 TEXT,
            mobile_2 TEXT,
            address TEXT,
            date_of_join TEXT,
            date_of_resign TEXT,
            working_status TEXT DEFAULT 'active',
            marital_status TEXT,
            job_role TEXT,
            department TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;
    
    Ok(conn)
}
