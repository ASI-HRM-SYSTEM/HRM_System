# Firebase Strategy & Account Management

> **Comprehensive guide for managing Firebase dependencies and ensuring continuity for template-based projects.**

---

## 🎯 Your Current Setup

```
├─ Firebase Account Type: Google Workspace Education (Student)
├─ Plan: Spark (Free)
├─ Database: Firestore
├─ Authentication: Google OAuth 2.0
├─ Storage: Cloud Storage (not currently used)
└─ Project: HRM_System (Production)
```

---

## ⚠️ Student Account Risks & Mitigation

### Risk 1: Account Expiration
**Problem:** Google Workspace Education expires when you leave school
```
Timeline: After graduation or school enrollment ends
Impact: Account deactivated → Firebase project credentials invalid
Severity: CRITICAL
```

**⛑️ Mitigation Strategies:**

1. **Option A: Transition to Personal Account (RECOMMENDED)**
   ```
   Step 1: Create personal Firebase project (free Spark plan)
   Step 2: Export Firestore data from student account
   Step 3: Import into new project
   Step 4: Update .env credentials
   Step 5: Test thoroughly
   Timeline: 30 minutes
   Cost: Free
   ```

2. **Option B: Transition to Paid Account (ENTERPRISE)**
   ```
   Step 1: Upgrade student account to Blaze pay-as-you-go
   Step 2: Add credit card
   Step 3: Keep same project running
   Timeline: 5 minutes
   Cost: ~$0 (unless high usage)
   Benefits: No data migration needed, scaled pricing
   ```

3. **Option C: Company Account (IF APPLICABLE)**
   ```
   If launching this as product: use company Firebase account
   Ensures continuity, professional billing
   ```

### Risk 2: Student Account Restrictions
**Limitations:**
- ❌ Some APIs blocked for student accounts
- ❌ Limited quota per day (varies by API)
- ❌ Cannot use for production commercial apps (ToS)

**✅ Features You Have:**
- Firestore Database (unlimited reads/writes under quota)
- Firebase Authentication (unlimited users under quota)
- Cloud Storage (not used currently)
- Analytics (available)

### Risk 3: Firebase Account Quotas
**Daily quotas on Spark plan:**
```
Firestore Reads:  50,000/day      → 1.7M/month (plenty for 100-200 users)
Firestore Writes: 20,000/day      → 600k/month (plenty for normal usage)
Delete Ops:       20,000/day      → 600k/month
Outbound Traffic: 1 GB/day        → ~30 GB/month

For employee database:
- 200 employees × 50 reads/month × 12 months = 120,000 reads/year
- Well under quota! You're safe.
```

---

## 📊 Firebase Plan Comparison

| Feature | Spark (Free) | Blaze (Pay-As-You-Go) | Firestore Managed |
|---------|---------|---------|---------|
| **Cost** | $0/month | ~$0 (if under quota) | Custom pricing |
| **Firestore Reads** | 50k/day | Unlimited | Unlimited |
| **Firestore Writes** | 20k/day | Unlimited | Unlimited |
| **Storage** | 5 GB total | 5 GB free, then $0.18/GB | Included |
| **Backup (Automated)** | Not available | Available | Available |
| **SLA** | None | 99.9% | 99.9% |
| **Support** | Community | Community | Priority |
| **Best For** | Learning/Testing | Production | Enterprise |

**Recommendation:** Stay on Spark (free) for now. Upgrade to Blaze only if you exceed quotas.

---

## 🔄 Data Export/Import Strategy

### Automated Backup Plan

**Monthly Backups (Automated via Cloud Functions):**
```typescript
// Runs monthly, exports Firestore to Cloud Storage
// Then download for safekeeping

import * as admin from 'firebase-admin';

export const backupFirestore = admin
  .firestore()
  .collection('employees')
  .export('gs://my-bucket/backups/employees-2026-03.json');
```

**Manual Backup Process:**
```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Export Firestore data
firebase firestore:export ./backups/firestore-backup-2026-03

# 4. Download backup locally
# File will be in ./backups/
```

**Migration Between Projects:**
```bash
# Export from Spark account
firebase firestore:export ./my-backup --project=source-project

# Import to new account
firebase firestore:import ./my-backup --project=target-project

# Update .env with new Firebase credentials
```

### Before Account Expiration (3 MONTHS PRIOR)

**Create transition plan NOW:**
1. **Assess current usage:**
   ```bash
   # Check Firebase usage in console
   # Firebase → Project Settings → Usage
   ```

2. **Plan migration timeline:**
   - Month -3: Decide between Personal/Paid account
   - Month -2: Test data export/import
   - Month -1: Create new project, export backups
   - Month 0: Cutover, deploy new credentials

3. **Communicate to users:**
   "System will be unavailable for 1 hour on [date] for database migration"

---

## 🔐 Firebase Security Rules

### Current Security Posture
```javascript
// firestore.rules (Current)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Issues:** Anyone authenticated can read/write anything ⚠️

### Recommended Rule Set
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only logged in users
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Employees - Manager+ can read, HR can write
    match /employees/{employeeId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role in ['admin', 'hr'];
      allow delete: if request.auth.token.role == 'admin';
    }
    
    // Audit logs - read-only for all, write internal
    match /auditLogs/{logId} {
      allow read: if request.auth != null;
      allow write: if request.auth == null; // Internal only
    }
  }
}
```

**Deploy security rules:**
```bash
firebase deploy --only firestore:rules
```

---

## 💾 Local Database Fallback Strategy

### Current Architecture
```
User ← Tauri App ← Firestore
         (no local cache)
```

**Problem:** Internet drops → App breaks

### Proposed Architecture: Offline-First
```
User ← Tauri App ← SQLite (Local)
         ↓
         Firebase (when online)
```

### Phase 1: Offline Detection (v2.1.0)
```typescript
// src/services/OfflineService.ts
export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};
```

### Phase 2: SQLite Integration (v2.2.0)
```
Tauri Backend (Rust):
├─ sqlite3 crate
├─ Create database on startup
├─ Mirror Firestore schema locally
└─ Sync on online status change
```

**Installation:**
```bash
cargo add rusqlite
cargo add sqlx
```

**Schema:**
```sql
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  department TEXT,
  position TEXT,
  phone TEXT,
  hireDate TEXT,
  status TEXT,
  lastSyncedAt INTEGER,
  syncPending BOOLEAN
);

CREATE TABLE auditLogs (
  id TEXT PRIMARY KEY,
  action TEXT,
  userId TEXT,
  targetId TEXT,
  timestamp INTEGER,
  syncPending BOOLEAN
);
```

### Phase 3: Sync Strategy (v2.3.0)
```typescript
// Sync Operations
Cache State:  Local SQLite ← → Firebase (when online)

Read: If ONLINE → Firebase else → SQLite
Write: ALWAYS Write to SQLite FIRST, queue sync if offline
Sync: When online, upload pending changes to Firebase

Conflict Resolution:
- Timestamp-based: Latest write wins
- Manual: User resolves conflicts
```

### Phase 4: UI Indicators (v2.1.0)
```jsx
// Show in header
{!isOnline ? (
  <div className="bg-yellow-100 text-yellow-800 p-2">
    ⚠️ Offline Mode: Changes will sync when online
  </div>
) : (
  <div className="bg-green-100 text-green-800 p-2">
    ✅ Connected to Firebase
  </div>
)}
```

---

## 📈 Implementation Timeline

### v2.1.0 (1-2 weeks)
- [ ] Offline detection (online/offline events)
- [ ] UI indicators (connection status)
- [ ] Graceful error handling

### v2.2.0 (2-3 weeks)
- [ ] SQLite integration (Rust backend)
- [ ] Local schema mirroring Firestore
- [ ] Initial sync on app launch

### v2.3.0 (3-4 weeks)
- [ ] Queue management (pending writes)
- [ ] Conflict resolution
- [ ] Batch sync operations
- [ ] Low bandwidth optimization

### v2.4.0 (TBD)
- [ ] Data compression
- [ ] Selective sync (don't cache everything)
- [ ] Storage quota management

---

## 🚨 Action Items for YOU

### Immediate (This Week)
- [ ] Document current Firebase project ID
- [ ] Enable automated backups in Firebase Console
- [ ] Download and test manual export
- [ ] Review firestore.rules (update security rules)

### Before Graduation (3 months out)
- [ ] Create personal Firebase account as backup
- [ ] Plan data migration strategy
- [ ] Test import/export process
- [ ] Decide: Blaze upgrade or Personal account

### Long-term (v2.1.0+)
- [ ] Implement offline mode detection
- [ ] Plans for local SQLite database
- [ ] Document sync strategy
- [ ] Test internet outage scenarios

---

## 📋 Firebase Project Checklist

### Security
- [ ] Firestore security rules updated
- [ ] Google OAuth app restrictions set (limit to your domain)
- [ ] No API keys exposed in client code (use .env)
- [ ] Firebase credentials in GitHub Secrets only

### Backups
- [ ] Automated backups enabled (if Blaze plan)
- [ ] Manual export tested
- [ ] Backup storage plan established
- [ ] Recovery process documented

### Monitoring
- [ ] Firebase Console alerts configured
- [ ] Usage monitored weekly
- [ ] Quota warnings enabled
- [ ] Error logging implemented

### Documentation
- [ ] .env template created (for other devs)
- [ ] Firebase setup guide written
- [ ] Credentials rotation schedule set
- [ ] Recovery procedures documented

---

## ⚡ Summary: What to Do RIGHT NOW

1. **Download the `.env` file contents and save locally** (secure backup)
   ```
   cp .env ~/.firebase-hrm-backup.env
   chmod 600 ~/.firebase-hrm-backup.env
   ```

2. **Review your Firebase quota usage:**
   - Firebase Console → Project Settings → Usage tab
   - Confirm you're well under limits

3. **Test data export:**
   ```
   firebase firestore:export ./test-export --project=hrm-system
   ```
   
4. **Set account expiration reminder:**
   - Calendar: Add alert 3 months before graduation
   - Subject: "Firebase Account Transition Plan"

5. **Review security rules:**
   - Apply recommended security rules from above
   - Deploy: `firebase deploy --only firestore:rules`

---

## 📞 Quick Reference

**Firebase CLI Commands:**
```bash
# Login
firebase login

# Export database
firebase firestore:export ./backup-folder

# Import database  
firebase firestore:import ./backup-folder

# Deploy rules
firebase deploy --only firestore:rules

# Check usage
firebase functions:log
```

**Crisis Recovery:**
- Account locked? → Use backup .env + personal account
- Data lost? → Restore from exported backup
- Quota exceeded? → Upgrade to Blaze or wait for reset
- Credentials leaked? → Regenerate in Firebase Console

---

**Last Updated:** March 7, 2026  
**Version:** 2.0.0  
**Scope:** Production
