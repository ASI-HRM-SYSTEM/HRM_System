#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Template Synchronization Script
# ==============================================================================
# This script syncs updates from the HRM_System template while preserving
# company-specific customizations.
#
# Usage:
#   npm run sync:template          # Syncs from main branch
#   ./scripts/sync-template.sh dev # Syncs from dev branch
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TEMPLATE_REMOTE="upstream"
TEMPLATE_URL="https://github.com/ASI-HRM-SYSTEM/HRM_System.git"
TEMPLATE_BRANCH="${1:-main}"

# ==============================================================================
# Personalization Files (will be preserved during sync)
# ==============================================================================
# These files contain company-specific data and should NOT be overwritten
# by template updates.
PERSONALIZATION_FILES=(
  "src/config/appConfig.ts"        # Company name, branding, developer info
  ".env"                            # Firebase credentials & company ID
  "src-tauri/tauri.conf.json"       # App identifier, product name
  "src-tauri/Cargo.toml"            # Package metadata
  "package.json"                    # Project name, version
  "firestore.rules"                 # Company-specific database rules
  ".templateignore"                 # Custom ignore patterns
  "README.md"                       # Company-specific README
  "public/favicon.ico"              # Company favicon
  "public/logo.png"                 # Company logo
  "src-tauri/icons/icon.png"        # App icons
  "src-tauri/icons/icon.ico"
  "src-tauri/icons/icon.icns"
  "src-tauri/icons/32x32.png"
  "src-tauri/icons/128x128.png"
  "src-tauri/icons/128x128@2x.png"
)

# ==============================================================================
# Pre-flight Checks
# ==============================================================================

echo "🔍 Checking working tree status..."
if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ Working tree is not clean. Commit or stash changes first."
  echo ""
  git status --short
  exit 1
fi

# ==============================================================================
# Setup Template Remote
# ==============================================================================

echo "🔗 Configuring template remote..."
if git remote get-url "$TEMPLATE_REMOTE" >/dev/null 2>&1; then
  CURRENT_URL="$(git remote get-url "$TEMPLATE_REMOTE")"
  if [[ "$CURRENT_URL" != "$TEMPLATE_URL" ]]; then
    echo "   Updating remote URL: $TEMPLATE_URL"
    git remote set-url "$TEMPLATE_REMOTE" "$TEMPLATE_URL"
  fi
else
  echo "   Adding remote: $TEMPLATE_REMOTE -> $TEMPLATE_URL"
  git remote add "$TEMPLATE_REMOTE" "$TEMPLATE_URL"
fi

# ==============================================================================
# Fetch Template Updates
# ==============================================================================

echo "📥 Fetching template updates from $TEMPLATE_REMOTE/$TEMPLATE_BRANCH..."
git fetch "$TEMPLATE_REMOTE" "$TEMPLATE_BRANCH"

# ==============================================================================
# Backup Personalization Files
# ==============================================================================

BACKUP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$BACKUP_DIR"
}
trap cleanup EXIT

echo "💾 Backing up personalization files..."
BACKUP_COUNT=0
for file in "${PERSONALIZATION_FILES[@]}"; do
  if [[ -f "$file" ]]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$file")"
    cp "$file" "$BACKUP_DIR/$file"
    BACKUP_COUNT=$((BACKUP_COUNT + 1))
    echo "   ✓ $file"
  fi
done
echo "   Backed up $BACKUP_COUNT files"

# ==============================================================================
# Merge Template Branch
# ==============================================================================

echo ""
echo "🔄 Merging template branch..."
if ! git merge --no-ff --no-commit "$TEMPLATE_REMOTE/$TEMPLATE_BRANCH"; then
  echo ""
  echo "⚠️  Merge requires manual conflict resolution."
  echo ""
  echo "To resolve conflicts:"
  echo "  1. Edit the conflicting files"
  echo "  2. git add <resolved-files>"
  echo "  3. git commit"
  echo ""
  echo "Your personalization files are still backed up at: $BACKUP_DIR"
  echo "You can manually restore them if needed."
  exit 1
fi

# ==============================================================================
# Restore Personalization Files
# ==============================================================================

echo "♻️  Restoring personalization files..."
RESTORE_COUNT=0
for file in "${PERSONALIZATION_FILES[@]}"; do
  if [[ -f "$BACKUP_DIR/$file" ]]; then
    cp "$BACKUP_DIR/$file" "$file"
    git add "$file"
    RESTORE_COUNT=$((RESTORE_COUNT + 1))
    echo "   ✓ $file"
  fi
done
echo "   Restored $RESTORE_COUNT files"

# ==============================================================================
# Remove Template-Only Files (from .templateignore)
# ==============================================================================

if [[ -f ".templateignore" ]]; then
  echo "🗑️  Removing template-only files (from .templateignore)..."
  REMOVE_COUNT=0
  
  # Read .templateignore and process patterns
  while IFS= read -r pattern || [[ -n "$pattern" ]]; do
    # Skip empty lines and comments
    [[ -z "$pattern" || "$pattern" =~ ^[[:space:]]*# ]] && continue
    
    # Remove leading/trailing whitespace
    pattern=$(echo "$pattern" | xargs)
    
    # Find and remove matching files
    while IFS= read -r file; do
      if [[ -f "$file" ]] || [[ -d "$file" ]]; then
        rm -rf "$file"
        git add "$file" 2>/dev/null || true
        REMOVE_COUNT=$((REMOVE_COUNT + 1))
        echo "   ✗ $file"
      fi
    done < <(find . -path "./.git" -prune -o -path "./node_modules" -prune -o -name "$pattern" -print 2>/dev/null || true)
  done < ".templateignore"
  
  if [[ $REMOVE_COUNT -gt 0 ]]; then
    echo "   Removed $REMOVE_COUNT template-specific files/directories"
  else
    echo "   No template-specific files to remove"
  fi
fi

# ==============================================================================
# Commit Merge
# ==============================================================================

echo ""
echo "💾 Committing merge..."
git commit -m "🔄 Merge template updates from $TEMPLATE_REMOTE/$TEMPLATE_BRANCH

- Synced with template version
- Preserved company personalization in:
$(printf '  - %s\n' "${PERSONALIZATION_FILES[@]}")

This merge was performed automatically by sync-template.sh"

# ==============================================================================
# Success!
# ==============================================================================

echo ""
echo "✅ Template sync complete!"
echo ""
echo "📁 Personalization preserved in:"
for file in "${PERSONALIZATION_FILES[@]}"; do
  if [[ -f "$file" ]]; then
    echo "   • $file"
  fi
done
echo ""
echo "🎯 Next steps:"
echo "   1. Review changes: git log -1 -p"
echo "   2. Test the application: npm run dev"
echo "   3. Push to your repository: git push"
echo ""
