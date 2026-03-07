# Local Database Implementation Guide

> **Implementing SQLite-based offline data caching to enable app functionality without internet.**

---

## 🎯 Vision

**Future State (v2.2.0+):**
```
Internet Available:
  User → React App → Firebase (primary source)
              ↓
           SQLite (cache)

Internet Offline:
  User → React App → SQLite (primary source)
              ↓
         (queue changes for sync)
```

**Benefits:**
- ✅ App works without internet (read cached data)
- ✅ Changes queued locally, synced when online
- ✅ Faster performance (local reads are instant)
- ✅ Better UX (no "loading forever" on slow connections)

---

## 📦 Architecture Overview

### Components

```
Tauri Backend (Rust)           Frontend (React/TypeScript)
─────────────────────────      ──────────────────────────
SQLite Database                 React Components
│                               │
├─ employees                    ├─ EmployeeTable
├─ auditLogs                    ├─ EmployeeForm
├─ users                        └─ Dashboard
└─ syncQueue
    ↓
[Tauri Invoke Commands]
    ↓
    React Hooks: useSQLiteQuery()
```

### Data Flow

```
1. App Load
   └─→ Check SQLite (local data exists? → Show immediately)
   └─→ Parallel: Check Firebase (if online → sync changes)

2. User Creates Employee
   └─→ Write to SQLite (instant)
   └─→ Mark as "pending sync"
   └─→ If online → upload to Firebase
   └─→ If offline → stay in pending queue

3. Online Status Changes
   └─→ Offline: Show cached data, queue operations
   └─→ Online: Sync pending changes, reconcile conflicts

4. App Close
   └─→ Save all pending operations locally
   └─→ Reopen → Resume sync from last checkpoint
```

---

## 🔧 Implementation Phases

### Phase 1: Database Setup (Week 1)

#### 1.1 Dependencies
```toml
# src-tauri/Cargo.toml
[dependencies]
rusqlite = { version = "0.30", features = ["bundled"] }
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "sqlite"] }
serde_json = "1.0"
chrono = "0.4"
uuid = { version = "1.0", features = ["v4", "serde"] }
```

#### 1.2 Rust Backend Implementation
```rust
// src-tauri/src/database.rs
use rusqlite::{Connection, Result as SqliteResult};
use std::path::PathBuf;

pub struct LocalDatabase {
    path: PathBuf,
}

impl LocalDatabase {
    pub fn new(app_handle: &tauri::AppHandle) -> SqliteResult<Self> {
        let app_dir = app_handle
            .path_resolver()
            .app_data_dir()
            .expect("failed to find app data dir");
        
        std::fs::create_dir_all(&app_dir).ok();
        
        let db_path = app_dir.join("hrm-data.db");
        
        // Create connection & initialize schema
        let conn = Connection::open(&db_path)?;
        
        // Create tables
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS employees (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT,
                department TEXT,
                position TEXT,
                phone TEXT,
                hireDate TEXT,
                status TEXT,
                salary REAL,
                createdAt INTEGER,
                updatedAt INTEGER,
                lastSyncedAt INTEGER,
                syncPending BOOLEAN DEFAULT 1
            );
            
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                action TEXT NOT NULL,
                userId TEXT,
                targetId TEXT,
                targetType TEXT,
                details TEXT,
                timestamp INTEGER,
                syncPending BOOLEAN DEFAULT 1
            );
            
            CREATE TABLE IF NOT EXISTS sync_queue (
                id TEXT PRIMARY KEY,
                operation TEXT,
                tableName TEXT,
                recordId TEXT,
                data TEXT,
                queuedAt INTEGER,
                retries INTEGER DEFAULT 0
            );"
        )?;
        
        Ok(Self { path: db_path })
    }
    
    pub fn get_employee(&self, id: &str) -> SqliteResult<serde_json::Value> {
        let conn = Connection::open(&self.path)?;
        let mut stmt = conn.prepare(
            "SELECT * FROM employees WHERE id = ?1"
        )?;
        
        let employee = stmt.query_row([id], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "name": row.get::<_, String>(1)?,
                // ... other fields
            }))
        })?;
        
        Ok(employee)
    }
    
    pub fn list_employees(&self) -> SqliteResult<Vec<serde_json::Value>> {
        let conn = Connection::open(&self.path)?;
        let mut stmt = conn.prepare("SELECT * FROM employees")?;
        
        let employees = stmt.query_map([], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "name": row.get::<_, String>(1)?,
            }))
        })?
        .collect::<SqliteResult<Vec<_>>>()?;
        
        Ok(employees)
    }
}
```

#### 1.3 Tauri Commands
```rust
// src-tauri/src/commands.rs
use tauri::State;
use crate::database::LocalDatabase;

#[tauri::command]
pub fn get_employees(db: State<LocalDatabase>) -> Result<Vec<serde_json::Value>, String> {
    db.list_employees()
        .map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub fn save_employee(
    id: String,
    data: serde_json::Value,
    db: State<LocalDatabase>
) -> Result<(), String> {
    db.save_employee(&id, &data)
        .map_err(|e| format!("Failed to save: {}", e))
}

#[tauri::command]
pub fn sync_pending_changes(db: State<LocalDatabase>) -> Result<u32, String> {
    db.get_pending_operations()
        .map_err(|e| format!("Sync error: {}", e))
}
```

---

### Phase 2: React Hook Integration (Week 2)

#### 2.1 Custom Hook
```typescript
// src/hooks/useSQLiteDB.ts
import { invoke } from "@tauri-apps/api/tauri";
import { useState, useEffect, useCallback } from "react";

interface UseSQLiteOptions {
  useCache?: boolean;
  syncOnMount?: boolean;
}

export const useSQLiteDB = (options: UseSQLiteOptions = {}) => {
  const { useCache = true, syncOnMount = true } = options;
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Fetch from local database
  const fetchFromDB = useCallback(async (table: string) => {
    try {
      setIsLoading(true);
      const result = await invoke("get_employees");
      setData(result);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch from ${table}: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to local database
  const saveToDB = useCallback(async (id: string, record: any) => {
    try {
      setIsPending(true);
      await invoke("save_employee", { id, data: record });
      setError(null);
    } catch (err) {
      setError(`Failed to save: ${err}`);
    } finally {
      setIsPending(false);
    }
  }, []);

  // Sync pending changes to Firebase
  const syncChanges = useCallback(async () => {
    try {
      const pendingCount = await invoke("sync_pending_changes");
      console.log(`Synced ${pendingCount} pending changes`);
      return pendingCount;
    } catch (err) {
      setError(`Sync failed: ${err}`);
      return 0;
    }
  }, []);

  // Auto-sync on mount
  useEffect(() => {
    if (syncOnMount) {
      syncChanges();
    }
  }, [syncOnMount, syncChanges]);

  return {
    data,
    isLoading,
    error,
    isPending,
    fetchFromDB,
    saveToDB,
    syncChanges,
  };
};
```

#### 2.2 Usage in Components
```typescript
// src/components/EmployeeTable.tsx
import { useSQLiteDB } from "../hooks/useSQLiteDB";

export const EmployeeTable = () => {
  const { data, isLoading, error, syncChanges } = useSQLiteDB({
    useCache: true,
    syncOnMount: true,
  });

  if (isLoading) return <div>Loading from cache...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <button onClick={() => syncChanges()} className="mb-4">
        🔄 Sync with Firebase
      </button>
      
      <table>
        <tbody>
          {data?.map((employee: any) => (
            <tr key={employee.id}>
              <td>{employee.name}</td>
              <td>{employee.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

### Phase 3: Online/Offline Handling (Week 3)

#### 3.1 Connection Status Hook
```typescript
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSync(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, lastSync };
};
```

#### 3.2 Connection Status Indicator
```typescript
// src/components/ConnectionStatus.tsx
import { useOnlineStatus } from "../hooks/useOnlineStatus";

export const ConnectionStatus = () => {
  const { isOnline, lastSync } = useOnlineStatus();

  return (
    <div
      className={`p-2 text-sm font-medium ${
        isOnline
          ? "bg-green-100 text-green-800"
          : "bg-yellow-100 text-yellow-800"
      }`}
    >
      {isOnline ? (
        <>
          ✅ Connected • Last sync: {lastSync?.toLocaleTimeString()}
        </>
      ) : (
        <>
          ⚠️ Offline • Changes will sync when online
        </>
      )}
    </div>
  );
};
```

---

### Phase 4: Firebase Sync (Week 4)

#### 4.1 Synchronization Service
```typescript
// src/services/SyncService.ts
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export class SyncService {
  async syncPendingChanges() {
    try {
      // Get pending operations from SQLite
      const pendingOps = await this.getPendingOperations();

      for (const op of pendingOps) {
        try {
          await this.syncOperation(op);
        } catch (err) {
          console.error(`Failed to sync operation ${op.id}:`, err);
          // Retry later
        }
      }

      return pendingOps.length;
    } catch (err) {
      console.error("Sync failed:", err);
      throw err;
    }
  }

  private async syncOperation(op: any) {
    const { operation, tableName, recordId, data } = op;

    if (operation === "CREATE" || operation === "UPDATE") {
      await setDoc(doc(db, tableName, recordId), JSON.parse(data), {
        merge: true,
      });
    } else if (operation === "DELETE") {
      // Handle delete
    }

    // Mark as synced in SQLite
    await this.markAsSynced(op.id);
  }

  private async getPendingOperations() {
    // Query SQLite for pending ops
    return [];
  }

  private async markAsSynced(opId: string) {
    // Update SQLite
  }
}
```

---

## 📊 Database Schema

### Employees Table
```sql
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  department TEXT,
  position TEXT,
  phone TEXT,
  hireDate TEXT,
  status TEXT,
  salary REAL,
  createdAt INTEGER,
  updatedAt INTEGER,
  lastSyncedAt INTEGER,
  syncPending BOOLEAN,
  conflictResolved BOOLEAN
);

CREATE INDEX idx_department ON employees(department);
CREATE INDEX idx_status ON employees(status);
CREATE INDEX idx_syncPending ON employees(syncPending);
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  userId TEXT,
  targetId TEXT,
  targetType TEXT,
  details TEXT,
  timestamp INTEGER,
  syncPending BOOLEAN,
  
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE INDEX idx_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_userId ON audit_logs(userId);
```

### Sync Queue Table
```sql
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  operation TEXT,          -- CREATE, UPDATE, DELETE
  tableName TEXT,           -- employees, auditLogs
  recordId TEXT,
  data TEXT,                -- JSON
  queuedAt INTEGER,
  retries INTEGER,
  lastError TEXT,
  
  FOREIGN KEY (recordId) REFERENCES employees(id)
);

CREATE INDEX idx_pending ON sync_queue(queuedAt ASC)
  WHERE operation IS NOT NULL;
```

---

## 🔄 Sync Strategy

### Three-Way Merge (Conflict Resolution)

```
Local SQLite      Firebase      Resolution
─────────────     ────────────  ─────────────
John Doe          John D.       Prompt user
updated 2 hours   updated now   ← Phone?
ago               by another    Device?
                  user          

Options:
A) Use Firebase version (latest)
B) Use Local version (my version)
C) Manual merge (combine both)
```

**Implementation:**
```typescript
export enum ConflictResolution {
  FIREBASE_WINS = "firebase",
  LOCAL_WINS = "local",
  MANUAL = "manual",
}

async function resolveConflict(
  localData: any,
  firebaseData: any,
  strategy: ConflictResolution
) {
  if (strategy === ConflictResolution.FIREBASE_WINS) {
    return firebaseData;
  } else if (strategy === ConflictResolution.LOCAL_WINS) {
    return localData;
  } else {
    // Merge: Firebase version + local overwrites
    return { ...firebaseData, ...localData };
  }
}
```

---

## 📝 Testing Checklist

### Unit Tests
- [ ] SQLite connection initialization
- [ ] CRUD operations (Create, Read, Update, Delete)
- [ ] Query filters and indexes
- [ ] Sync queue operations

### Integration Tests
- [ ] Local save + Firebase sync
- [ ] Conflict resolution scenarios
- [ ] Offline mode switching
- [ ] Partial sync (resume interrupted)

### E2E Tests
- [ ] User creates employee offline → syncs online
- [ ] User edits while offline → syncs changed fields
- [ ] Duplicate/conflicting edits → reconcile
- [ ] App crash → resume from checkpoint
- [ ] Network timeout → retry queue

### Performance Tests
- [ ] 1000+ employees: load time < 500ms
- [ ] Bulk sync: 100 changes < 5 seconds
- [ ] Database file size: < 50MB

---

## 🚀 Rollout Plan

### v2.1.0 (April 2026)
```
✅ Phase 1: Database setup (SQLite, schema)
✅ Phase 2: React hook integration (useSQLiteDB)
⏳ Phase 3: Online/offline detection
⏳ Phase 4: Manual sync button
```

### v2.2.0 (May 2026)
```
✅ Phase 4: Firebase sync service
✅ Phase 5: Conflict resolution UI
✅ Phase 6: Automated sync on connection restore
```

### v2.3.0 (June 2026)
```
✅ Phase 7: Offline-first read priority
✅ Phase 8: Bandwidth optimization
✅ Phase 9: Storage quota management
```

---

## 📋 Implementation Checklist

### Setup
- [ ] Add rusqlite to Cargo.toml
- [ ] Create database.rs in src-tauri/src/
- [ ] Define database schema
- [ ] Create Tauri commands

### React Integration
- [ ] Create useSQLiteDB hook
- [ ] Create useOnlineStatus hook
- [ ] Create ConnectionStatus component
- [ ] Update EmployeeTable to use hooks

### Sync
- [ ] Create SyncService
- [ ] Implement conflict resolution
- [ ] Add retry logic
- [ ] Add error notifications

### Testing
- [ ] Unit tests for database
- [ ] Integration tests with Firebase
- [ ] E2E tests offline scenarios
- [ ] Performance benchmarks

### Documentation
- [ ] Document schema changes
- [ ] Create troubleshooting guide
- [ ] Add FAQ for offline mode
- [ ] Document sync limitations

---

## ⚠️ Known Limitations

| Limitation | Impact | Workaround |
|-----------|--------|-----------|
| Database sync lag | 1-5 min delay | Real-time indicators show syncing status |
| Conflict resolution | User must choose version | Timestamp-based auto-resolution for same field |
| Bandwidth intensive | Large datasets slow | Implement delta sync (only changed fields) |
| Disk space | ~1-50MB per 1000 employees | Add cleanup for old audit logs |
| Concurrent edits | Last write wins without merge | Add column-level timestamps for 3-way merge |

---

## 📞 Support & FAQ

**Q: Will this work offline?**
A: Yes! App will work with cached data. Writes queue locally and sync when online.

**Q: What if I'm offline and someone else edits the same employee?**
A: Conflict resolution prompts you to choose version when you go online.

**Q: How much data can I cache locally?**
A: ~50MB comfortably. 1000+ employees = 5-10MB database file.

**Q: Will this slow down the app?**
A: No. Local reads are 10x faster than Firebase. Overall performance improves.

**Q: Can I disable offline mode?**
A: Not recommended, but yes. Remove sync logic and always require online.

---

## 🎯 Success Metrics

After v2.2.0 implementation:
```
✅ App loads in < 1 second (local cache)
✅ Offline mode works seamlessly
✅ 99% sync success rate
✅ Conflict resolution < 5 sec
✅ Database file < 50MB
✅ User rating improves by 2+ stars
```

---

**Last Updated:** March 7, 2026  
**Version:** 2.0.0 (Planning)  
**Scope:** Future Implementation (v2.1.0+)
