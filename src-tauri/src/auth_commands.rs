use crate::models::{CreateUserRequest, LoginRequest, UpdateUserRequest, UserInfo, UserPermissions, UserSession};
use crate::{hash_password, verify_password, CurrentUser, DbConnection};
use std::io::{Read, Write};
use std::net::TcpListener;
use std::time::{Duration, Instant};
use tauri::{Emitter, State};

const GOOGLE_OAUTH_CALLBACK_PORT: u16 = 43189;

/// Starts a temporary local HTTP server on a fixed localhost port to capture the OAuth callback.
/// Returns the port so the frontend can build the redirect_uri as http://localhost:PORT.
/// After receiving the OAuth callback request, emits "oauth-callback" with the full
/// URL (e.g. "http://localhost:PORT/?code=...") to the frontend and closes.
#[tauri::command]
pub async fn start_google_auth(app: tauri::AppHandle) -> Result<u16, String> {
    // Google OAuth requires an exact redirect URI match.
    // Use a fixed localhost callback port (must be registered in OAuth client settings).
    let listener = TcpListener::bind(("localhost", GOOGLE_OAUTH_CALLBACK_PORT)).map_err(|e| {
        format!(
            "Failed to bind OAuth callback port {} on localhost: {}",
            GOOGLE_OAUTH_CALLBACK_PORT, e
        )
    })?;
    let port = GOOGLE_OAUTH_CALLBACK_PORT;

    // Spawn a background thread to wait for the OAuth callback.
    std::thread::spawn(move || {
        listener.set_nonblocking(true).ok();

        // Set a 5-minute deadline: if no callback arrives, the thread exits cleanly.
        let deadline = Instant::now() + Duration::from_secs(300);

        loop {
            if Instant::now() >= deadline {
                let _ = app.emit("oauth-callback-error", "Sign-in timed out. Please try again.");
                break;
            }

            // Accept the next browser connection.
            match listener.accept() {
                Ok((mut stream, _)) => {
                    // Give the browser up to 2s to send the request.
                    stream.set_read_timeout(Some(std::time::Duration::from_secs(2))).ok();

                    let mut buffer = [0u8; 8192];
                    let bytes_read = stream.read(&mut buffer).unwrap_or(0);
                    let request = String::from_utf8_lossy(&buffer[..bytes_read]);

                    // HTTP request line: "GET /path HTTP/1.1"
                    let path = request
                        .lines()
                        .next()
                        .and_then(|line| line.split_whitespace().nth(1))
                        .unwrap_or("/");

                    // Skip favicon.ico and any other non-callback requests.
                    // The real OAuth callback always has query parameters (code=, state=, etc.)
                    if path == "/favicon.ico" || path == "/" || !path.contains('?') {
                        // Respond with a minimal 204 and keep waiting.
                        let _ = stream.write_all(b"HTTP/1.1 204 No Content\r\nConnection: close\r\n\r\n");
                        continue;
                    }

                    let callback_url = format!("http://localhost:{}{}", port, path);

                    // Respond with a styled success page.
                    let html = "<html><head><title>Sign In Successful</title>\
                        <style>body{font-family:sans-serif;display:flex;justify-content:center;\
                        align-items:center;height:100vh;margin:0;background:#0f172a;color:#e2e8f0;}\
                        .card{text-align:center;padding:2rem;border-radius:1rem;\
                        background:#1e293b;border:1px solid #334155;}\
                        h2{color:#4ade80;margin-bottom:0.5rem;}p{color:#94a3b8;}</style></head>\
                        <body><div class=\"card\"><h2>&#10003; Sign In Successful</h2>\
                        <p>Authentication complete. You can close this window.</p>\
                        </div></body></html>";
                    let response = format!(
                        "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                        html.len(), html
                    );
                    let _ = stream.write_all(response.as_bytes());

                    // Emit the OAuth callback URL to the frontend.
                    let _ = app.emit("oauth-callback", callback_url);
                    break; // Done — exit the loop.
                }
                Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    std::thread::sleep(Duration::from_millis(150));
                    continue;
                }
                Err(e) => {
                    let _ = app.emit("oauth-callback-error", e.to_string());
                    break;
                }
            }
        }
    });

    Ok(port)
}


#[tauri::command]
pub fn login(
    request: LoginRequest,
    db: State<'_, DbConnection>,
    current_user: State<'_, CurrentUser>,
) -> Result<UserSession, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let result = conn.query_row(
        "SELECT id, username, password_hash, full_name, role, department_access, is_active,
                can_view_employees, can_add_employees, can_edit_employees, can_delete_employees,
                can_manage_users, can_view_all_departments, can_export_data, can_view_reports,
                can_manage_settings, can_backup_database, can_view_audit_logs
         FROM users WHERE username = ?1",
        [&request.username],
        |row| {
            Ok((
                row.get::<_, i32>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, bool>(6)?,
                row.get::<_, bool>(7)?,
                row.get::<_, bool>(8)?,
                row.get::<_, bool>(9)?,
                row.get::<_, bool>(10)?,
                row.get::<_, bool>(11)?,
                row.get::<_, bool>(12)?,
                row.get::<_, bool>(13)?,
                row.get::<_, bool>(14)?,
                row.get::<_, bool>(15)?,
                row.get::<_, bool>(16)?,
                row.get::<_, bool>(17)?,
            ))
        },
    );
    
    match result {
        Ok((id, username, password_hash, full_name, role, department_access, is_active,
            can_view_employees, can_add_employees, can_edit_employees, can_delete_employees,
            can_manage_users, can_view_all_departments, can_export_data, can_view_reports,
            can_manage_settings, can_backup_database, can_view_audit_logs)) => {
            if !is_active {
                return Err("Account is deactivated. Please contact administrator.".to_string());
            }
            
            if !verify_password(&request.password, &password_hash) {
                return Err("Invalid username or password".to_string());
            }
            
            // Update last login time
            let _ = conn.execute(
                "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?1",
                [&id],
            );
            
            // Build permissions from database columns
            let permissions = UserPermissions {
                can_view_employees,
                can_add_employees,
                can_edit_employees,
                can_delete_employees,
                can_manage_users,
                can_view_all_departments,
                can_export_data,
                can_view_reports,
                can_manage_settings,
                can_backup_database,
                can_view_audit_logs,
            };
            
            let session = UserSession {
                user_id: id,
                username,
                full_name,
                role,
                department_access,
                permissions,
            };
            
            // Store session
            let mut user_lock = current_user.0.lock().map_err(|e| e.to_string())?;
            *user_lock = Some(session.clone());
            
            Ok(session)
        }
        Err(_) => Err("Invalid username or password".to_string()),
    }
}

#[tauri::command]
pub fn logout(current_user: State<'_, CurrentUser>) -> Result<(), String> {
    let mut user_lock = current_user.0.lock().map_err(|e| e.to_string())?;
    *user_lock = None;
    Ok(())
}

#[tauri::command]
pub fn get_current_user(current_user: State<'_, CurrentUser>) -> Result<Option<UserSession>, String> {
    let user_lock = current_user.0.lock().map_err(|e| e.to_string())?;
    Ok(user_lock.clone())
}

#[tauri::command]
pub fn create_user(
    request: CreateUserRequest,
    db: State<'_, DbConnection>,
    current_user: State<'_, CurrentUser>,
) -> Result<(), String> {
    // Check if current user is admin
    let user_lock = current_user.0.lock().map_err(|e| e.to_string())?;
    match &*user_lock {
        Some(session) if session.permissions.can_manage_users => {}
        _ => return Err("Permission denied. Only administrators can create users.".to_string()),
    }
    drop(user_lock);
    
    // Validate role
    let valid_roles = ["admin", "hr_manager", "hr_staff", "viewer", "custom"];
    if !valid_roles.contains(&request.role.as_str()) {
        return Err("Invalid role specified".to_string());
    }
    
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let password_hash = hash_password(&request.password);
    
    // Get permissions - either from request or from role defaults
    let permissions = request.permissions.unwrap_or_else(|| UserPermissions::from_role(&request.role));
    
    conn.execute(
        "INSERT INTO users (username, password_hash, full_name, role, department_access,
                           can_view_employees, can_add_employees, can_edit_employees, can_delete_employees,
                           can_manage_users, can_view_all_departments, can_export_data, can_view_reports,
                           can_manage_settings, can_backup_database) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
        rusqlite::params![
            request.username,
            password_hash,
            request.full_name,
            request.role,
            request.department_access,
            permissions.can_view_employees,
            permissions.can_add_employees,
            permissions.can_edit_employees,
            permissions.can_delete_employees,
            permissions.can_manage_users,
            permissions.can_view_all_departments,
            permissions.can_export_data,
            permissions.can_view_reports,
            permissions.can_manage_settings,
            permissions.can_backup_database,
        ],
    )
    .map_err(|e| {
        if e.to_string().contains("UNIQUE constraint") {
            "Username already exists".to_string()
        } else {
            e.to_string()
        }
    })?;
    
    Ok(())
}

#[tauri::command]
pub fn get_all_users(
    db: State<'_, DbConnection>,
    current_user: State<'_, CurrentUser>,
) -> Result<Vec<UserInfo>, String> {
    // Check if current user is admin
    let user_lock = current_user.0.lock().map_err(|e| e.to_string())?;
    match &*user_lock {
        Some(session) if session.permissions.can_manage_users => {}
        _ => return Err("Permission denied".to_string()),
    }
    drop(user_lock);
    
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = conn
        .prepare(
            "SELECT id, username, full_name, role, department_access, is_active, created_at, last_login,
                    can_view_employees, can_add_employees, can_edit_employees, can_delete_employees,
                    can_manage_users, can_view_all_departments, can_export_data, can_view_reports,
                    can_manage_settings, can_backup_database, can_view_audit_logs
             FROM users ORDER BY id",
        )
        .map_err(|e| e.to_string())?;
    
    let users = stmt
        .query_map([], |row| {
            Ok(UserInfo {
                id: row.get(0)?,
                username: row.get(1)?,
                full_name: row.get(2)?,
                role: row.get(3)?,
                department_access: row.get(4)?,
                is_active: row.get(5)?,
                created_at: row.get(6)?,
                last_login: row.get(7)?,
                permissions: Some(UserPermissions {
                    can_view_employees: row.get(8)?,
                    can_add_employees: row.get(9)?,
                    can_edit_employees: row.get(10)?,
                    can_delete_employees: row.get(11)?,
                    can_manage_users: row.get(12)?,
                    can_view_all_departments: row.get(13)?,
                    can_export_data: row.get(14)?,
                    can_view_reports: row.get(15)?,
                    can_manage_settings: row.get(16)?,
                    can_backup_database: row.get(17)?,
                    can_view_audit_logs: row.get(18)?,
                }),
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(users)
}

#[tauri::command]
pub fn update_user(
    request: UpdateUserRequest,
    db: State<'_, DbConnection>,
    current_user: State<'_, CurrentUser>,
) -> Result<(), String> {
    // Check if current user is admin
    let user_lock = current_user.0.lock().map_err(|e| e.to_string())?;
    match &*user_lock {
        Some(session) if session.permissions.can_manage_users => {}
        _ => return Err("Permission denied".to_string()),
    }
    drop(user_lock);
    
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Get permissions - either from request or from role defaults
    let permissions = request.permissions.unwrap_or_else(|| UserPermissions::from_role(&request.role));
    
    conn.execute(
        "UPDATE users SET full_name = ?1, role = ?2, department_access = ?3, is_active = ?4,
                         can_view_employees = ?5, can_add_employees = ?6, can_edit_employees = ?7,
                         can_delete_employees = ?8, can_manage_users = ?9, can_view_all_departments = ?10,
                         can_export_data = ?11, can_view_reports = ?12, can_manage_settings = ?13,
                         can_backup_database = ?14, can_view_audit_logs = ?15
         WHERE id = ?16",
        rusqlite::params![
            request.full_name,
            request.role,
            request.department_access,
            request.is_active,
            permissions.can_view_employees,
            permissions.can_add_employees,
            permissions.can_edit_employees,
            permissions.can_delete_employees,
            permissions.can_manage_users,
            permissions.can_view_all_departments,
            permissions.can_export_data,
            permissions.can_view_reports,
            permissions.can_manage_settings,
            permissions.can_backup_database,
            permissions.can_view_audit_logs,
            request.user_id,
        ],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn delete_user(
    user_id: i32,
    db: State<'_, DbConnection>,
    current_user: State<'_, CurrentUser>,
) -> Result<(), String> {
    // Check if current user is admin
    let user_lock = current_user.0.lock().map_err(|e| e.to_string())?;
    let current_user_id = match &*user_lock {
        Some(session) if session.permissions.can_manage_users => session.user_id,
        _ => return Err("Permission denied".to_string()),
    };
    drop(user_lock);
    
    // Prevent deleting self
    if current_user_id == user_id {
        return Err("Cannot delete your own account".to_string());
    }
    
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    conn.execute("DELETE FROM users WHERE id = ?1", [&user_id])
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn reset_user_password(
    user_id: i32,
    new_password: String,
    db: State<'_, DbConnection>,
    current_user: State<'_, CurrentUser>,
) -> Result<(), String> {
    // Check if current user is admin
    let user_lock = current_user.0.lock().map_err(|e| e.to_string())?;
    match &*user_lock {
        Some(session) if session.permissions.can_manage_users => {}
        _ => return Err("Permission denied".to_string()),
    }
    drop(user_lock);
    
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let password_hash = hash_password(&new_password);
    
    conn.execute(
        "UPDATE users SET password_hash = ?1 WHERE id = ?2",
        rusqlite::params![password_hash, user_id],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn change_own_password(
    current_password: String,
    new_password: String,
    db: State<'_, DbConnection>,
    current_user: State<'_, CurrentUser>,
) -> Result<(), String> {
    let user_lock = current_user.0.lock().map_err(|e| e.to_string())?;
    let user_id = match &*user_lock {
        Some(session) => session.user_id,
        None => return Err("Not logged in".to_string()),
    };
    drop(user_lock);
    
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    
    // Verify current password
    let stored_hash: String = conn
        .query_row(
            "SELECT password_hash FROM users WHERE id = ?1",
            [&user_id],
            |row| row.get(0),
        )
        .map_err(|_| "User not found".to_string())?;
    
    if !verify_password(&current_password, &stored_hash) {
        return Err("Current password is incorrect".to_string());
    }
    
    let new_hash = hash_password(&new_password);
    conn.execute(
        "UPDATE users SET password_hash = ?1 WHERE id = ?2",
        rusqlite::params![new_hash, user_id],
    )
    .map_err(|e| e.to_string())?;
    
    Ok(())
}
