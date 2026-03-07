use crate::models::{CreateUserRequest, LoginRequest, UpdateUserRequest, UserInfo, UserPermissions, UserSession};
use crate::{hash_password, verify_password, CurrentUser, DbConnection};
use std::io::{Read, Write};
use std::net::TcpListener;
use std::time::{Duration, Instant};
use tauri::{Emitter, State};

const OAUTH_PORT: u16 = 43189;

/// Starts a local HTTP server that:
///   GET /auth  → serves an HTML page with Firebase JS SDK that does signInWithPopup
///   GET /callback?idToken=...  → captures the token and emits it to the Tauri frontend
///
/// The system browser opens http://localhost:PORT/auth and displays a "Continue with Google"
/// button. When clicked, signInWithPopup works perfectly (no popup blockers in external browser).
/// After sign-in, the page navigates to /callback which the Rust server captures.
#[tauri::command]
pub async fn start_google_auth(
    app: tauri::AppHandle,
    firebase_config: String,
) -> Result<u16, String> {
    let listener = TcpListener::bind(("127.0.0.1", OAUTH_PORT)).map_err(|e| {
        format!("Port {} busy: {}", OAUTH_PORT, e)
    })?;

    std::thread::spawn(move || {
        listener.set_nonblocking(true).ok();
        let deadline = Instant::now() + Duration::from_secs(300);

        // Build the HTML auth page once — it embeds the Firebase config.
        let auth_html = build_auth_page(&firebase_config);

        loop {
            if Instant::now() >= deadline {
                let _ = app.emit("oauth-callback-error", "Sign-in timed out.");
                break;
            }

            match listener.accept() {
                Ok((mut stream, _)) => {
                    stream.set_read_timeout(Some(Duration::from_secs(2))).ok();
                    let mut buf = [0u8; 8192];
                    let n = stream.read(&mut buf).unwrap_or(0);
                    let req = String::from_utf8_lossy(&buf[..n]);

                    let path = req.lines().next()
                        .and_then(|l| l.split_whitespace().nth(1))
                        .unwrap_or("/");

                    // ── Serve the Firebase auth page ─────────────────────────
                    if path == "/auth" {
                        let resp = format!(
                            "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n\
                             Content-Length: {}\r\nConnection: close\r\n\r\n{}",
                            auth_html.len(), auth_html
                        );
                        let _ = stream.write_all(resp.as_bytes());
                        continue; // keep listening for /callback
                    }

                    // ── Capture the token callback ───────────────────────────
                    if path.starts_with("/callback?") {
                        // Extract idToken from query string
                        let qs = &path["/callback?".len()..];
                        let id_token = qs.split('&')
                            .find_map(|pair| {
                                let (k, v) = pair.split_once('=')?;
                                if k == "idToken" { Some(v.to_string()) } else { None }
                            });

                        let success_html = "<html><head><title>Sign In OK</title>\
                            <style>body{font-family:sans-serif;display:flex;justify-content:center;\
                            align-items:center;height:100vh;margin:0;background:#0f172a;color:#e2e8f0;}\
                            .c{text-align:center;padding:2rem;border-radius:1rem;\
                            background:#1e293b;border:1px solid #334155;}\
                            h2{color:#4ade80;}p{color:#94a3b8;}</style></head>\
                            <body><div class=\"c\"><h2>&#10003; Sign In Successful</h2>\
                            <p>You can close this tab and return to the app.</p></div></body></html>";
                        let resp = format!(
                            "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n\
                             Content-Length: {}\r\nConnection: close\r\n\r\n{}",
                            success_html.len(), success_html
                        );
                        let _ = stream.write_all(resp.as_bytes());

                        match id_token {
                            Some(token) => { let _ = app.emit("oauth-callback", token); }
                            None => { let _ = app.emit("oauth-callback-error", "No token received"); }
                        }
                        break;
                    }

                    // ── Anything else (favicon, etc.) ────────────────────────
                    let _ = stream.write_all(b"HTTP/1.1 204 No Content\r\nConnection: close\r\n\r\n");
                }
                Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    std::thread::sleep(Duration::from_millis(150));
                }
                Err(e) => {
                    let _ = app.emit("oauth-callback-error", e.to_string());
                    break;
                }
            }
        }
    });

    Ok(OAUTH_PORT)
}

/// Builds an HTML page that loads Firebase JS SDK from CDN and performs
/// Google signInWithPopup. On success, extracts token and sends to /callback.
fn build_auth_page(firebase_config_json: &str) -> String {
    format!(r#"<!DOCTYPE html>
<html><head>
<meta charset="utf-8"><title>HRM Sign In</title>
<style>
  body {{ font-family: -apple-system, sans-serif; display: flex; justify-content: center;
         align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }}
  .card {{ text-align: center; padding: 3rem; border-radius: 1.5rem; background: white;
           box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 400px; width: 90%; }}
  .logo {{ width: 80px; height: 80px; margin: 0 auto 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
           border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }}
  h2 {{ margin: 0 0 0.5rem; color: #1a202c; font-size: 1.5rem; }}
  p {{ color: #718096; font-size: 0.95rem; margin: 0.5rem 0 2rem; }}
  .btn {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;
          padding: 14px 32px; border-radius: 50px; font-size: 1rem; font-weight: 600; cursor: pointer;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease; display: inline-flex;
          align-items: center; gap: 10px; }}
  .btn:hover {{ transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6); }}
  .btn:active {{ transform: translateY(0); }}
  .btn:disabled {{ opacity: 0.6; cursor: not-allowed; transform: none; }}
  .spinner {{ border: 3px solid #e2e8f0; border-top: 3px solid #667eea; border-radius: 50%;
              width: 20px; height: 20px; animation: spin 0.8s linear infinite; }}
  @keyframes spin {{ 0% {{ transform: rotate(0deg); }} 100% {{ transform: rotate(360deg); }} }}
  .err {{ color: #e53e3e; margin-top: 1rem; padding: 1rem; background: #fff5f5; border-radius: 8px;
          border: 1px solid #feb2b2; }}
  .hidden {{ display: none; }}
  .google-icon {{ width: 20px; height: 20px; }}
</style>
</head><body>
<div class="card">
  <div class="logo">👤</div>
  <h2>New Lanka Clothing</h2>
  <p>HRM System — Sign in with your Google account</p>
  <button id="signInBtn" class="btn" onclick="doSignIn()">
    <svg class="google-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
    <span id="btnText">Continue with Google</span>
  </button>
  <div id="error" class="hidden">
    <p class="err" id="errMsg"></p>
  </div>
</div>
<script type="module">
  import {{ initializeApp }} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js';
  import {{ getAuth, signInWithPopup, GoogleAuthProvider }} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';

  const config = {firebase_config_json};
  const app = initializeApp(config);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({{ prompt: 'select_account' }});

  window.doSignIn = async function() {{
    const btn = document.getElementById('signInBtn');
    const btnText = document.getElementById('btnText');
    const errorDiv = document.getElementById('error');
    
    btn.disabled = true;
    btnText.innerHTML = '<div class="spinner"></div><span>Signing in...</span>';
    errorDiv.classList.add('hidden');
    
    try {{
      console.log('[Auth] Starting Google sign-in popup...');
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      
      console.log('[Auth] Sign-in successful! Token received.');
      btnText.textContent = 'Success! Redirecting...';
      
      // Send token back to local server → Tauri app
      window.location.href = '/callback?idToken=' + encodeURIComponent(idToken);
    }} catch (err) {{
      console.error('[Auth] Sign-in error:', err);
      btn.disabled = false;
      btnText.textContent = 'Continue with Google';
      errorDiv.classList.remove('hidden');
      
      let errorMsg = 'Sign-in failed. Please try again.';
      if (err.code === 'auth/popup-closed-by-user') {{
        errorMsg = 'Sign-in was cancelled. Click the button to try again.';
      }} else if (err.code === 'auth/network-request-failed') {{
        errorMsg = 'Network error. Please check your connection and try again.';
      }} else if (err.message) {{
        errorMsg = err.message;
      }}
      
      document.getElementById('errMsg').textContent = errorMsg;
    }}
  }};
</script>
</body></html>"#)
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
