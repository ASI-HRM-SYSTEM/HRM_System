# Template Sync System

This HRM System uses a template-based architecture where production instances can automatically sync updates from the template repository while preserving company-specific customizations.

## 🎯 Overview

**Template Repository:** `https://github.com/ASI-HRM-SYSTEM/HRM_System.git`

The template contains:
- ✅ All source code and features
- ✅ Documentation for maintainers
- ✅ Development guides and change logs
- ✅ Sync scripts and automation

Production instances contain:
- ✅ All source code (synced from template)
- ✅ Company-specific configurations
- ✅ Company branding and assets
- ✅ Simple README with run instructions
- ❌ No template documentation (kept clean)

## 🔄 How It Works

### 1. Automatic Sync (GitHub Actions)

Production repositories automatically check for template updates:
- **Daily** at 2 AM UTC
- **On-demand** via GitHub Actions UI
- **Via webhook** when template is updated

The workflow:
1. Fetches latest template changes
2. Merges updates into production
3. Preserves company-specific files
4. Removes template documentation
5. Commits and pushes changes

### 2. Manual Sync

Run locally when needed:

```bash
npm run sync:template
```

Or sync a specific branch:

```bash
./scripts/sync-template.sh develop
```

## 📝 File Preservation

The following files are **automatically preserved** during sync (never overwritten):

### Configuration Files
- `src/config/appConfig.ts` - Company name, branding, developer info
- `.env` - Firebase credentials & company ID
- `src-tauri/tauri.conf.json` - App identifier, product name
- `src-tauri/Cargo.toml` - Package metadata
- `package.json` - Project name, version
- `firestore.rules` - Company-specific database rules

### Assets
- `README.md` - Company-specific README
- `public/favicon.ico` - Company favicon
- `public/logo.png` - Company logo
- `src-tauri/icons/*` - All icon files

### Configuration
- `.templateignore` - Custom exclusion patterns

## 🚫 Template Documentation Exclusion

Production instances **automatically exclude** template documentation:

**Excluded from production:**
- `TEMPLATE_*.md` - Template guides
- `FIREBASE_STRATEGY.md`
- `LOCAL_DATABASE_IMPLEMENTATION.md`
- `PRODUCTION_RELEASE_SUMMARY.md`
- `PROJECT_DOCS.md`
- `QUICK_RELEASE_GUIDE.md`
- `RELEASE_NOTES_*.md`
- `docs/` folder

**Kept in production:**
- `README.md` - Simple run instructions (company-specific)

## 🛠️ Setting Up a New Production Instance

### Step 1: Clone as Template

```bash
git clone https://github.com/ASI-HRM-SYSTEM/HRM_System.git my-company-hrm
cd my-company-hrm
git remote rename origin upstream
git remote add origin <your-production-repo-url>
```

### Step 2: Customize Configuration

Edit `src/config/appConfig.ts`:
```typescript
export const APP_CONFIG = {
  name: "HRM System",
  companyName: "ABC Company (Pvt) Ltd",
  companyAddress: "123 Business Street",
  productTitle: "HRM System - ABC Company",
  version: "2.0.0",
  developerName: "Your Name",
  linkedinUrl: "https://www.linkedin.com/in/yourprofile",
};
```

Edit `.env`:
```bash
VITE_FB_API_KEY=your_firebase_api_key
VITE_FB_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FB_PROJECT_ID=your-project-id
VITE_FB_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FB_MESSAGING_SENDER_ID=your_sender_id
VITE_FB_APP_ID=your_app_id
VITE_FB_COMPANY_ID=yourcompany
```

Edit `src-tauri/tauri.conf.json`:
```json
{
  "productName": "ABC HRM System",
  "identifier": "com.abccompany.hrm"
}
```

### Step 3: Create Simple README

Replace `README.md` with basic instructions:
```markdown
# HRM System - ABC Company

Quick setup and installation guide for ABC Company's HRM system.

## Installation
- [Download instructions]

## Development
- npm install
- npm run tauri dev

## Contact
- IT Support: support@abccompany.com
```

### Step 4: Remove Template Documentation

```bash
rm -rf TEMPLATE_*.md FIREBASE_STRATEGY.md LOCAL_DATABASE_IMPLEMENTATION.md \
  PRODUCTION_RELEASE_SUMMARY.md PROJECT_DOCS.md QUICK_RELEASE_GUIDE.md \
  RELEASE_NOTES_*.md docs/
```

Or run the sync script (it will do this automatically):
```bash
npm run sync:template
```

### Step 5: Initial Commit

```bash
git add .
git commit -m "Initial setup for ABC Company"
git push -u origin main
```

### Step 6: Enable GitHub Actions

The `.github/workflows/template-sync.yml` is already included. It will:
- Run daily at 2 AM UTC
- Check for template updates
- Auto-merge and preserve your customizations

To trigger manually:
1. Go to GitHub → Actions
2. Select "Sync with Template"
3. Click "Run workflow"

## 🔍 .templateignore File

Customize which files should be excluded from sync by editing `.templateignore`:

```bash
# Template documentation (already excluded by default)
TEMPLATE_*.md
docs/

# Add your custom exclusions
# my-custom-config.json
# company-specific/
```

Lines starting with `#` are comments. Supports glob patterns.

## 🔧 Troubleshooting

### Merge Conflicts

If automatic sync fails due to conflicts:

```bash
# The script will stop and show conflict details
# Resolve conflicts manually:
git status
# Edit conflicting files
git add <resolved-files>
git commit
```

### Preserving Additional Files

Add them to the `PERSONALIZATION_FILES` array in `scripts/sync-template.sh`:

```bash
PERSONALIZATION_FILES=(
  "src/config/appConfig.ts"
  "my-custom-file.ts"  # Add your file here
  ...
)
```

### Excluding Additional Patterns

Add patterns to `.templateignore`:

```bash
# Custom patterns
custom-reports/
*.company-specific.md
```

## 📊 Sync Workflow Diagram

```
Template Repo (HRM_System)
    │
    │ (push to main)
    │
    ↓
GitHub Actions Trigger (daily/webhook)
    │
    ↓
Production Repo (Your-Company-HRM)
    │
    ├─→ Fetch template updates
    ├─→ Backup personalization files
    ├─→ Merge template changes
    ├─→ Restore personalization files
    ├─→ Remove template documentation
    └─→ Commit & push to production
```

## 📚 Benefits

1. **Always Up-to-Date**: Get latest features and bug fixes automatically
2. **No Manual Merging**: Script handles merge conflicts gracefully
3. **Preserved Customization**: Company data never overwritten
4. **Clean Production**: No unnecessary documentation clutter
5. **Version Control**: All syncs are tracked in git history
6. **Rollback Support**: Can revert any sync if needed

## 🎓 Best Practices

### For Template Maintainers
- ✅ Keep generic placeholder values in template
- ✅ Document all changes in RELEASE_NOTES
- ✅ Test before pushing to main
- ✅ Use semantic versioning
- ✅ Avoid hardcoded company names

### For Production Instances
- ✅ Only modify files in `PERSONALIZATION_FILES`
- ✅ Keep .templateignore updated
- ✅ Test after each sync
- ✅ Report issues back to template maintainer
- ✅ Never commit `.env` to git

## 🔗 Related Documentation

- [TEMPLATE_SETUP_GUIDE.md](TEMPLATE_SETUP_GUIDE.md) - Initial setup
- [TEMPLATE_USAGE.md](TEMPLATE_USAGE.md) - Using as template
- [QUICK_RELEASE_GUIDE.md](QUICK_RELEASE_GUIDE.md) - Release process
- [PROJECT_DOCS.md](PROJECT_DOCS.md) - Full documentation

## ⚡ Quick Reference

```bash
# Manual sync
npm run sync:template

# Sync specific branch
./scripts/sync-template.sh develop

# Check what files are preserved
cat scripts/sync-template.sh | grep "PERSONALIZATION_FILES"

# Check what files are excluded
cat .templateignore

# Test sync locally (dry run)
git fetch upstream main
git diff HEAD...upstream/main
```

---

**This system ensures your production instances stay updated while keeping company data safe! 🎉**
