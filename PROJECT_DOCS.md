# HRM System — Project Documentation

> **New Lanka Clothing** | Version: `1.2.5` | Last Updated: 2026-03-03

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [Implemented Features (Completed)](#5-implemented-features-completed)
6. [Work In Progress (WIP)](#6-work-in-progress-wip)
7. [Bugs Fixed](#7-bugs-fixed)
8. [Known Issues / Current Problems](#8-known-issues--current-problems)
9. [Next Steps & Roadmap](#9-next-steps--roadmap)
10. [API / Tauri Commands Reference](#10-api--tauri-commands-reference)
11. [User Roles & Permissions](#11-user-roles--permissions)
12. [Development Guide](#12-development-guide)
13. [Implementation Plan & Bug Docs](#13-implementation-plan--bug-docs)

---

## 13. Implementation Plan & Bug Docs

Detailed authentication implementation and issue tracking documents are maintained in the dedicated `docs/` folder:

- [docs/README.md](docs/README.md)
- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
- [docs/BUG_REPORTS.md](docs/BUG_REPORTS.md)

---

## 1. Project Overview

A **cross-platform desktop HR Management System** built for garment factory operations at New Lanka Clothing. The application runs natively on **Windows and Linux** using Tauri, with a React frontend and a local SQLite database — no internet connection required for core operations.

The system supports dual-layer authentication:

- **Firebase Gate** — cloud-based allowlist (optional, skipped if `.env` not configured)
- **Local Auth** — username/password stored in the local SQLite database

---

## 2. Tech Stack

### Frontend

| Technology            | Version       | Purpose                  |
| --------------------- | ------------- | ------------------------ |
| React                 | 18.3.x        | UI framework             |
| TypeScript            | 5.5.x         | Type safety              |
| Vite                  | 5.4.x         | Build tool / dev server  |
| TailwindCSS           | 3.4.x         | Utility-first styling    |
| Recharts              | 2.13.x        | Dashboard charts         |
| react-datepicker      | 9.1.x         | Date input components    |
| qrcode / qrcode.react | 1.5.x / 4.2.x | QR code generation       |
| Firebase              | 11.4.x        | Optional cloud auth gate |

### Backend (Rust / Tauri)

| Technology         | Version        | Purpose                 |
| ------------------ | -------------- | ----------------------- |
| Tauri              | 2.x            | Desktop app framework   |
| Rust               | 2021 edition   | Backend logic           |
| rusqlite           | 0.31 (bundled) | SQLite integration      |
| Serde / serde_json | 1.x            | Serialization           |
| base64             | 0.22           | Employee image encoding |
| thiserror          | 1.x            | Error handling          |

### Tauri Plugins

| Plugin                 | Purpose                          |
| ---------------------- | -------------------------------- |
| `tauri-plugin-shell`   | Shell command execution          |
| `tauri-plugin-updater` | Auto-update from GitHub Releases |
| `tauri-plugin-process` | App restart after update         |
| `tauri-plugin-dialog`  | File open/save dialogs           |
| `tauri-plugin-fs`      | File system access               |

### Infrastructure

| Tool                | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| GitHub Actions      | CI/CD: auto-build & release                     |
| GitHub Releases     | Distributes `.msi`, `.deb`, `.AppImage`, `.rpm` |
| Firebase (optional) | Cloud allowlist for deployment control          |

---

## 3. Project Structure

```text
HRM_System/
├── index.html                  # HTML entry point
├── package.json                # npm dependencies (v1.2.5)
├── vite.config.ts              # Vite build config
├── tailwind.config.js          # Tailwind config
├── tsconfig.json               # TypeScript config
├── .env                        # Firebase credentials (gitignored)
├── .env.example                # Firebase env template
├── firestore.rules             # Firestore security rules
├── PROJECT_DOCS.md             # ← This file
│
├── src/                        # React + TypeScript Frontend
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Root component + routing + auth gates
│   ├── index.css               # Global styles
│   │
│   ├── components/             # Page-level UI components
│   │   ├── Dashboard.tsx           # Stats overview, charts
│   │   ├── EmployeeManagement.tsx  # Employee list + filter controls
│   │   ├── EmployeeTable.tsx       # Sortable employee table
│   │   ├── EmployeeForm.tsx        # Add/Edit employee modal form
│   │   ├── EmployeeProfile.tsx     # Full employee detail view
│   │   ├── UserManagement.tsx      # Admin: create/edit/delete users
│   │   ├── AuditLogViewer.tsx      # Audit log browser with filters
│   │   ├── DailyCaderReport.tsx    # Daily attendance cader report
│   │   ├── DatabaseBackup.tsx      # DB export/import UI
│   │   ├── FirebaseLogin.tsx       # Firebase auth gate screen
│   │   ├── Login.tsx               # Local username/password login
│   │   ├── Sidebar.tsx             # Navigation sidebar
│   │   ├── UpdateChecker.tsx       # Auto-update notifications
│   │   ├── CustomDatePicker.tsx    # Reusable date picker wrapper
│   │   ├── Footer.tsx              # App footer with developer info
│   │   └── WorkInProgress.tsx      # Placeholder for incomplete pages
│   │
│   ├── context/
│   │   ├── AuthContext.tsx          # Local auth state (SQLite user session)
│   │   └── FirebaseAuthContext.tsx  # Firebase auth state
│   │
│   ├── controllers/
│   │   ├── AuditController.ts
│   │   ├── AuthController.ts
│   │   ├── EmployeeController.ts
│   │   ├── ExportController.ts
│   │   └── index.ts
│   │
│   ├── services/
│   │   ├── AuditService.ts
│   │   ├── AuthService.ts
│   │   ├── CaderService.ts
│   │   ├── EmployeeService.ts
│   │   ├── ExportService.ts
│   │   ├── FilterService.ts
│   │   ├── FirebaseSyncService.ts
│   │   └── index.ts
│   │
│   ├── models/
│   │   ├── Employee.ts
│   │   ├── User.ts
│   │   ├── Common.ts
│   │   └── index.ts
│   │
│   ├── types/
│   │   └── (TypeScript interface definitions)
│   │
│   └── config/
│       └── (App configuration)
│
├── src-tauri/                  # Rust / Tauri Backend
│   ├── Cargo.toml              # Rust dependencies
│   ├── tauri.conf.json         # Tauri config (window, bundles, updater)
│   ├── build.rs                # Build script
│   └── src/
│       ├── main.rs             # Tauri entry point, plugin registration
│       ├── lib.rs              # DB init, table creation, migration
│       ├── commands.rs         # All Tauri #[command] handlers (~1350 lines)
│       ├── auth_commands.rs    # Login, logout, user CRUD commands
│       └── models.rs           # Rust structs for DB models
│
└── .github/
    └── workflows/
        └── release.yml         # GitHub Actions: build + upload release artifacts
```

---

## 4. Database Schema

The SQLite database (`hrm_system.db`) is stored in the OS app data directory and auto-migrated on startup.

### `employees`

| Column               | Type    | Notes                                   |
| -------------------- | ------- | --------------------------------------- |
| `epf_number`         | TEXT PK | Employee Provident Fund number          |
| `name_with_initials` | TEXT    | e.g., K.A.S. Perera                     |
| `full_name`          | TEXT    | Full legal name                         |
| `dob`                | TEXT    | Date of birth                           |
| `nic`                | TEXT    | National ID Card number ✅ _added v1.x_ |
| `gender`             | TEXT    | Male / Female / Other ✅ _added v1.x_   |
| `police_area`        | TEXT    | Police area/jurisdiction                |
| `transport_route`    | TEXT    | Factory bus route                       |
| `mobile_1`           | TEXT    | Primary phone                           |
| `mobile_2`           | TEXT    | Secondary phone                         |
| `address`            | TEXT    | Home address                            |
| `date_of_join`       | TEXT    | Start date                              |
| `date_of_resign`     | TEXT    | Resignation date                        |
| `working_status`     | TEXT    | `active` / `resign`                     |
| `marital_status`     | TEXT    | Married / Single / etc.                 |
| `cader`              | TEXT    | Cader category                          |
| `designation`        | TEXT    | Job designation                         |
| `allocation`         | TEXT    | Line/section allocation                 |
| `department`         | TEXT    | Department name                         |
| `image_path`         | TEXT    | Relative path to employee photo         |
| `created_at`         | TEXT    | Auto timestamp                          |

### `users`

| Column                     | Type        | Notes                                                 |
| -------------------------- | ----------- | ----------------------------------------------------- |
| `id`                       | INTEGER PK  | Auto-increment                                        |
| `username`                 | TEXT UNIQUE | Login username                                        |
| `password_hash`            | TEXT        | Hashed password                                       |
| `full_name`                | TEXT        | Display name                                          |
| `role`                     | TEXT        | `admin`, `hr_manager`, `hr_staff`, `viewer`, `custom` |
| `department_access`        | TEXT        | NULL = all; comma-separated = limited                 |
| `is_active`                | INTEGER     | 0/1                                                   |
| `can_view_employees`       | INTEGER     | 0/1                                                   |
| `can_add_employees`        | INTEGER     | 0/1                                                   |
| `can_edit_employees`       | INTEGER     | 0/1                                                   |
| `can_delete_employees`     | INTEGER     | 0/1                                                   |
| `can_manage_users`         | INTEGER     | 0/1                                                   |
| `can_view_all_departments` | INTEGER     | 0/1                                                   |
| `can_export_data`          | INTEGER     | 0/1                                                   |
| `can_view_reports`         | INTEGER     | 0/1                                                   |
| `can_manage_settings`      | INTEGER     | 0/1                                                   |
| `can_backup_database`      | INTEGER     | 0/1                                                   |
| `can_view_audit_logs`      | INTEGER     | 0/1                                                   |
| `created_at`               | TEXT        | Auto timestamp                                        |
| `last_login`               | TEXT        | Last login timestamp                                  |

### `banks`

| Column       | Type        | Notes          |
| ------------ | ----------- | -------------- |
| `id`         | INTEGER PK  | Auto-increment |
| `name`       | TEXT UNIQUE | Bank name      |
| `created_at` | TEXT        | Auto timestamp |

Pre-seeded with 15 common Sri Lankan banks (BOC, People's Bank, Commercial Bank, HNB, Sampath, etc.)

### `employee_bank_accounts`

| Column           | Type                | Notes               |
| ---------------- | ------------------- | ------------------- |
| `id`             | INTEGER PK          | Auto-increment      |
| `epf_number`     | TEXT FK → employees | Cascade delete      |
| `bank_id`        | INTEGER FK → banks  | Restrict delete     |
| `account_number` | TEXT                | Bank account number |
| `created_at`     | TEXT                | Auto timestamp      |

### `audit_logs`

| Column        | Type       | Notes                                                             |
| ------------- | ---------- | ----------------------------------------------------------------- |
| `id`          | INTEGER PK |                                                                   |
| `user_id`     | INTEGER    | FK to users                                                       |
| `username`    | TEXT       | Denormalized for log permanence                                   |
| `action`      | TEXT       | `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `EXPORT`, `VIEW` |
| `entity_type` | TEXT       | `EMPLOYEE`, `USER`, `DATABASE`, `SYSTEM`                          |
| `entity_id`   | TEXT       | EPF number or user ID                                             |
| `old_value`   | TEXT       | JSON snapshot before change                                       |
| `new_value`   | TEXT       | JSON snapshot after change                                        |
| `ip_address`  | TEXT       | Optional                                                          |
| `details`     | TEXT       | Human-readable description                                        |
| `created_at`  | TEXT       | Auto timestamp                                                    |

### `daily_cader_reports`

| Column                         | Type        | Notes                   |
| ------------------------------ | ----------- | ----------------------- |
| `id`                           | INTEGER PK  |                         |
| `report_date`                  | TEXT UNIQUE | One record per day      |
| `budget_cader`                 | INTEGER     | Target headcount        |
| `actual_cader`                 | INTEGER     | Present + absent        |
| `present_cader`                | INTEGER     |                         |
| `absent_count`                 | INTEGER     |                         |
| `absent_percent`               | REAL        |                         |
| `training_line_cader`          | INTEGER     | Training section totals |
| `training_line_present`        | INTEGER     |                         |
| `training_line_absent_count`   | INTEGER     |                         |
| `training_line_absent_percent` | REAL        |                         |
| `lto_up_to_date`               | INTEGER     | LTO attendance figure   |
| `created_by`                   | TEXT        | Username                |
| `created_at` / `updated_at`    | TEXT        | Timestamps              |

### `training_line_details`

| Column           | Type                             | Notes                    |
| ---------------- | -------------------------------- | ------------------------ |
| `id`             | INTEGER PK                       |                          |
| `report_id`      | INTEGER FK → daily_cader_reports | Cascade delete           |
| `line_name`      | TEXT                             | e.g., "Line A", "Line B" |
| `actual_cader`   | INTEGER                          |                          |
| `present_cader`  | INTEGER                          |                          |
| `absent_count`   | INTEGER                          |                          |
| `absent_percent` | REAL                             |                          |

---

## 5. Implemented Features (Completed)

### ✅ Authentication System

- [x] Local username/password login with salted hash
- [x] Default admin account auto-created on first run (`admin` / `admin123`)
- [x] Session stored in app memory via `CurrentUser` Rust state
- [x] Firebase Auth Gate — optional cloud allowlist via `.env` configuration
- [x] Role-based access control (admin, hr_manager, hr_staff, viewer, custom)
- [x] Granular permission flags per user (11 permissions)
- [x] Login/logout audit trail

### ✅ Employee Management

- [x] Add new employees with all fields
- [x] Edit existing employee records
- [x] Delete employees (with cascade delete of bank accounts)
- [x] Employee photo upload (base64 → saved as file in app data dir)
- [x] Employee photo display in profile view
- [x] NIC (National ID Card) field
- [x] Gender field (Male/Female/Other)
- [x] Multiple bank accounts per employee (linked to `banks` table)
- [x] Full name + name with initials fields
- [x] Date of birth, join date, resign date
- [x] Marital status
- [x] Police area, transport route, address
- [x] Cader, designation, allocation, department fields
- [x] Working status (active / resign)
- [x] Advanced search and filter by: EPF number, department, transport route, working status
- [x] EPF number as primary key

### ✅ Dashboard

- [x] Total / active / resigned employee counts
- [x] Recent joinings (last 30 days)
- [x] Recent resignations (last 30 days)
- [x] Department breakdown chart (Recharts)
- [x] Cader breakdown chart
- [x] Allocation breakdown chart

### ✅ Daily Cader Report

- [x] One report per date (upsert pattern)
- [x] Budget vs actual vs present cader tracking
- [x] Absent count and percent auto-calculation
- [x] Training line section (separate aggregate stats)
- [x] Per-line training detail rows (dynamic, variable number of lines)
- [x] LTO up-to-date figure
- [x] Report save and retrieve by date
- [x] History view (list of past reports)

### ✅ User Management (Admin only)

- [x] Create new users
- [x] Edit existing users (name, role, department access, permissions)
- [x] Deactivate/activate users
- [x] Delete users
- [x] Fine-grained permission editing per user
- [x] Department access restriction (limit to specific departments or all)
- [x] QR code generation per user (likely for ID/login)

### ✅ Audit Log Viewer (Permission-gated)

- [x] View all system audit events
- [x] Filter by: username, action type, entity type, date range
- [x] Paginated results
- [x] Shows old/new value JSON diffs for changes
- [x] Every CREATE, UPDATE, DELETE, LOGIN, LOGOUT automatically logged

### ✅ Database Backup & Restore

- [x] Export database (copy `.db` file via file dialog)
- [x] Import database (validate tables, backup current, replace)
- [x] Display DB info: file size, employee count, user count
- [x] Permission-gated (`can_backup_database`)

### ✅ Data Export

- [x] Export employees to CSV
- [x] Export employees to HTML report
- [x] Export filtered subsets
- [x] Permission-gated (`can_export_data`)

### ✅ Auto-Update System

- [x] In-app update checker via `tauri-plugin-updater`
- [x] Update endpoint: GitHub Releases `latest.json`
- [x] Signed update artifacts (minisign public key in `tauri.conf.json`)
- [x] Automatic download and passive install (Windows)
- [x] `UpdateChecker` component shown on every page

### ✅ Build & Release Pipeline

- [x] GitHub Actions workflow (`release.yml`)
- [x] Auto-builds: `.msi` (Windows), `.deb`, `.AppImage`, `.rpm` (Linux)
- [x] Publishes to GitHub Releases on version tag push

### ✅ Other UI Features

- [x] Sidebar navigation with permission-aware menu items
- [x] `WorkInProgress` placeholder for upcoming pages
- [x] Footer with developer credits
- [x] Database initialization error screen with retry button
- [x] DB migration support: `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` pattern

---

## 6. Work In Progress (WIP)

These pages are listed in the sidebar but show a "Work In Progress" placeholder:

| Page             | Route Key    | Icon | Description                                              |
| ---------------- | ------------ | ---- | -------------------------------------------------------- |
| Job Desk         | `jobdesk`    | 💼   | Job designation & department management                  |
| Leave Management | `leave`      | 🏖️   | Leave requests, approvals, balance tracking              |
| Attendance       | `attendance` | 📋   | Fingerprint attendance import from Excel, daily tracking |
| Payroll          | `payroll`    | 💰   | Salary calculation, payslips, payroll reports            |
| Settings         | `settings`   | ⚙️   | App settings, configuration, backup/restore              |

---

## 7. Bugs Fixed

### Build / Infrastructure

- **Stale build artifacts** causing incorrect file path references in Cargo — fixed by cleaning `src-tauri/target/` directory (`cargo clean`).
- **`npm ENOENT: uv_cwd` error** when running `npm run tauri dev` from wrong directory — fixed by running from project root `/mnt/Projects/GIT/HRM_System`.

### Database / Backend

- **Column migration**: Added `ALTER TABLE ... ADD COLUMN` guards so that existing databases (before NIC/gender were added) are auto-migrated without data loss.
- **`job_role` → `designation` rename migration**: Added SQL `UPDATE employees SET designation = job_role WHERE designation IS NULL` to migrate legacy records on startup.
- **Missing `can_view_audit_logs` column**: Added migration guard `ALTER TABLE users ADD COLUMN can_view_audit_logs` for databases created before this permission was introduced.
- **Permission columns missing from older DBs**: All 11 permission columns now have `ALTER TABLE users ADD COLUMN ...` migration guards in `lib.rs`.

### Frontend Fixes

- **Employee form**: Added NIC field, Gender dropdown (select), and multiple bank account management (add/remove rows) to the employee create/edit form.
- **Employee profile**: Added NIC and Gender display sections, and a bank accounts list display.

---

## 8. Known Issues / Current Problems

> Track these and fix before next major release.

### Security

- ⚠️ **Weak password hashing**: `hash_password()` uses Rust's `DefaultHasher` with a static salt — this is **not cryptographically secure**. Should be replaced with `bcrypt` or `argon2` before production deployment with sensitive data.
- ⚠️ **Default credentials**: Default admin is `admin` / `admin123` — there is no forced first-login password change mechanism.
- ⚠️ **CSP is disabled**: `tauri.conf.json` has `"csp": null`. Should be configured with a proper Content Security Policy.

### Architecture

- ⚠️ **Single Mutex for DB**: The entire SQLite database is behind a single `Mutex<Connection>`. Under concurrent UI operations this will serialize all DB access (currently acceptable for desktop use but could cause UI hangs).
- ⚠️ **No connection pooling**: Each command locks the same single connection.
- ⚠️ **Import requires app restart**: The database import feature (`import_database`) cannot hot-swap the connection — it notifies the user to restart after import. A proper restart mechanism (via `tauri-plugin-process`) should be implemented.

### Frontend Issues

- ⚠️ **Settings page not implemented** — the `"settings"` route shows WIP; backup/restore is accessible from the sidebar "Backup" route instead, creating confusion.
- ⚠️ **README is outdated** — still documents `v1.0.0` URLs and the old schema (missing NIC, gender, bank accounts, audit logs, cader reports, etc.).

---

## 9. Next Steps & Roadmap

### 🔴 High Priority (Fix Now)

- [ ] **Replace `DefaultHasher` with `bcrypt`** — add `bcrypt` crate, rehash on next login, store new hash
- [ ] **Force first-login password change** — detect if password is still `admin123`, redirect to change-password screen
- [ ] **Fix README** — update to current version, feature list, and schema
- [ ] **Implement app restart** after database import using `tauri-plugin-process`
- [ ] **Add CSP** to `tauri.conf.json`

### 🟡 Medium Priority (Next Sprint)

- [ ] **Settings Page** — App-level settings (theme, language, default department, etc.)
- [ ] **Job Desk / Designation Management** — CRUD UI for caders, designations, departments, allocations (currently these are free-text fields with autocomplete from existing data; they should be managed as lookup tables)
- [ ] **Leave Management Module**
  - Leave types (annual, casual, medical, etc.)
  - Leave request submission
  - Approval workflow
  - Leave balance tracking per employee
- [ ] **Attendance Module**
  - Excel/CSV import for fingerprint attendance data
  - Daily attendance status per employee
  - Integration with cader report

### 🟢 Lower Priority (Future)

- [ ] **Payroll Module**
  - Salary structure (basic + allowances + deductions)
  - Monthly payroll calculation
  - Payslip generation (PDF)
  - Payroll reports
- [ ] **Employee Self-Service** (if web version desired)
- [ ] **Reporting Dashboard enhancements** — turnover rate, department trend charts, age distribution
- [ ] **Dark mode** support (Tailwind `dark:` classes already configured)
- [ ] **Multi-language** support (Sinhala, Tamil, English)
- [ ] **Connection pooling** for DB (`r2d2` + `r2d2_sqlite`)
- [ ] **Backup scheduling** — auto-backup to a folder daily/weekly
- [ ] **Firebase Sync** — the `FirebaseSyncService.ts` file exists but sync logic needs implementation

---

## 10. API / Tauri Commands Reference

All commands are defined in `src-tauri/src/commands.rs` and `auth_commands.rs` and invoked from the frontend via `invoke()`.

### Employee Commands

| Command                         | Args                 | Returns         | Description            |
| ------------------------------- | -------------------- | --------------- | ---------------------- |
| `init_database`                 | —                    | `()`            | Confirms DB is ready   |
| `get_employees`                 | `EmployeeFilters`    | `Vec<Employee>` | Filtered employee list |
| `get_employee_by_epf`           | `epf_number: String` | `Employee`      | Single employee lookup |
| `create_employee`               | `Employee`           | `()`            | Insert + audit log     |
| `update_employee`               | `Employee`           | `()`            | Update + audit log     |
| `delete_employee`               | `epf_number: String` | `()`            | Delete + audit log     |
| `get_distinct_departments`      | —                    | `Vec<String>`   | Autocomplete source    |
| `get_distinct_transport_routes` | —                    | `Vec<String>`   | Autocomplete source    |
| `get_distinct_police_areas`     | —                    | `Vec<String>`   | Autocomplete source    |
| `get_distinct_designations`     | —                    | `Vec<String>`   | Autocomplete source    |
| `get_distinct_allocations`      | —                    | `Vec<String>`   | Autocomplete source    |

### Image Commands

| Command               | Args                                        | Returns                    | Description                         |
| --------------------- | ------------------------------------------- | -------------------------- | ----------------------------------- |
| `save_employee_image` | `epf_number`, `image_data: String (base64)` | `String (path)`            | Saves image file to app data dir    |
| `get_employee_image`  | `image_path: String`                        | `String (base64 data URL)` | Reads and returns image as data URL |
| `save_binary_file`    | `file_path`, `data: Vec<u8>`                | `()`                       | Generic binary file save            |

### Dashboard & Stats

| Command               | Args | Returns          | Description         |
| --------------------- | ---- | ---------------- | ------------------- |
| `get_dashboard_stats` | —    | `DashboardStats` | Counts + breakdowns |

### Bank Accounts

| Command                       | Args                                                  | Returns                    | Description              |
| ----------------------------- | ----------------------------------------------------- | -------------------------- | ------------------------ |
| `get_banks`                   | —                                                     | `Vec<Bank>`                | List of all banks        |
| `get_employee_bank_accounts`  | `epf_number: String`                                  | `Vec<EmployeeBankAccount>` | Accounts for an employee |
| `save_employee_bank_accounts` | `epf_number`, `accounts: Vec<SaveBankAccountRequest>` | `()`                       | Replace all accounts     |

### Audit Logs

| Command          | Args              | Returns          | Description             |
| ---------------- | ----------------- | ---------------- | ----------------------- |
| `get_audit_logs` | `AuditLogFilters` | `AuditLogResult` | Paginated filtered logs |

### Cader Reports

| Command                    | Args                     | Returns                    | Description           |
| -------------------------- | ------------------------ | -------------------------- | --------------------- |
| `save_cader_report`        | `SaveCaderReportRequest` | `i64 (report_id)`          | Upsert report by date |
| `get_cader_report`         | `report_date: String`    | `Option<DailyCaderReport>` | Get report for date   |
| `get_cader_report_history` | `limit: i32`             | `Vec<DailyCaderReport>`    | Recent reports list   |

### Database Backup

| Command             | Args                       | Returns  | Description                |
| ------------------- | -------------------------- | -------- | -------------------------- |
| `export_database`   | `destination_path: String` | `String` | Copy DB file               |
| `import_database`   | `source_path: String`      | `String` | Validate + replace DB      |
| `get_database_info` | —                          | `JSON`   | Size, employee/user counts |

### Auth Commands (`auth_commands.rs`)

| Command            | Args                                      | Returns               | Description                    |
| ------------------ | ----------------------------------------- | --------------------- | ------------------------------ |
| `login`            | `LoginRequest`                            | `UserSession`         | Authenticate + set CurrentUser |
| `logout`           | —                                         | `()`                  | Clear session + audit log      |
| `get_current_user` | —                                         | `Option<UserSession>` | Get active session             |
| `get_users`        | —                                         | `Vec<UserInfo>`       | All users (admin only)         |
| `create_user`      | `CreateUserRequest`                       | `()`                  | Add user                       |
| `update_user`      | `UpdateUserRequest`                       | `()`                  | Edit user                      |
| `delete_user`      | `user_id: i32`                            | `()`                  | Remove user                    |
| `change_password`  | `user_id`, `old_password`, `new_password` | `()`                  | Password change                |

---

## 11. User Roles & Permissions

### Predefined Roles

| Permission           | admin | hr_manager | hr_staff | viewer |
| -------------------- | :---: | :--------: | :------: | :----: |
| View employees       |  ✅   |     ✅     |    ✅    |   ✅   |
| Add employees        |  ✅   |     ✅     |    ✅    |   ❌   |
| Edit employees       |  ✅   |     ✅     |    ❌    |   ❌   |
| Delete employees     |  ✅   |     ✅     |    ❌    |   ❌   |
| Manage users         |  ✅   |     ❌     |    ❌    |   ❌   |
| View all departments |  ✅   |     ✅     |    ❌    |   ❌   |
| Export data          |  ✅   |     ✅     |    ❌    |   ❌   |
| View reports         |  ✅   |     ✅     |    ❌    |   ❌   |
| Manage settings      |  ✅   |     ❌     |    ❌    |   ❌   |
| Backup database      |  ✅   |     ❌     |    ❌    |   ❌   |
| View audit logs      |  ✅   |     ❌     |    ❌    |   ❌   |

> `custom` role allows any combination of the above permissions to be set individually per user.

---

## 12. Development Guide

### Prerequisites

- Node.js v18+
- Rust (stable, latest)
- Tauri CLI v2

### Linux System Dependencies

**Arch Linux / Omarchy (pacman):**

```bash
sudo pacman -S webkit2gtk-4.1 libappindicator-gtk3 librsvg patchelf
```

**Debian / Ubuntu (apt):**

```bash
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

### Running in Development

```bash
cd /mnt/Projects/GIT/HRM_System
npm install
npm run tauri dev
```

### Building for Production

```bash
npm run tauri build
# Outputs: src-tauri/target/release/bundle/
```

### Releasing a New Version

1. Update version in both `package.json` and `src-tauri/tauri.conf.json` (they must match)
2. Commit and push
3. Create a git tag: `git tag v1.x.x && git push --tags`
4. GitHub Actions will build and publish automatically

### Database Location

| OS      | Path                                                    |
| ------- | ------------------------------------------------------- |
| Linux   | `~/.local/share/com.newlankaclothing.hrm/hrm_system.db` |
| Windows | `%APPDATA%\com.newlankaclothing.hrm\hrm_system.db`      |

### Adding a New Tauri Command

1. Add Rust struct to `models.rs` if needed
2. Add `#[tauri::command] pub fn ...` to `commands.rs` or `auth_commands.rs`
3. Register the command in `main.rs` → `invoke_handler(tauri::generate_handler![..., new_command])`
4. Call from frontend: `invoke("new_command", { arg1, arg2 })`

### Adding a New Page

1. Create `src/components/NewPage.tsx`
2. Add route key to `PageType` union in `Sidebar.tsx`
3. Add sidebar nav item in `Sidebar.tsx`
4. Add case to `renderPage()` switch in `App.tsx`

---

_Documentation maintained by: **Asitha Kanchana** | [LinkedIn](https://www.linkedin.com/in/asithakanchana)_
