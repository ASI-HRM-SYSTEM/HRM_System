# CI/CD Setup Guide: Automated Builds with Secrets Management

This guide explains how to set up GitHub Actions CI/CD to automatically build and release the HRM System without pushing `.env` files to the repository.

---

## 🔐 Problem: Environment Secrets

The HRM System requires Firebase credentials stored in `.env`:
```env
VITE_FB_API_KEY=AIzaSyC...
VITE_FB_AUTH_DOMAIN=newlanka-hrm.firebaseapp.com
VITE_FB_PROJECT_ID=newlanka-hrm
VITE_FB_STORAGE_BUCKET=newlanka-hrm.appspot.com
VITE_FB_MESSAGING_SENDER_ID=123456789
VITE_FB_APP_ID=1:123456789:web:abc123
VITE_FB_COMPANY_ID=newlanka
```

**Security Rule:** NEVER commit `.env` to git (it's in `.gitignore`).

---

## ✅ Solution: GitHub Actions Secrets

GitHub Actions can inject secrets as environment variables during the build process.

### Step 1: Add Secrets to GitHub Repository

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each Firebase variable:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `VITE_FB_API_KEY` | Firebase API Key | `AIzaSyC...` |
| `VITE_FB_AUTH_DOMAIN` | Firebase Auth Domain | `newlanka-hrm.firebaseapp.com` |
| `VITE_FB_PROJECT_ID` | Firebase Project ID | `newlanka-hrm` |
| `VITE_FB_STORAGE_BUCKET` | Firebase Storage Bucket | `newlanka-hrm.appspot.com` |
| `VITE_FB_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `123456789` |
| `VITE_FB_APP_ID` | Firebase App ID | `1:123456789:web:abc123` |
| `VITE_FB_COMPANY_ID` | Company ID for Firestore | `newlanka` |

5. Click **Add secret** for each one

### Step 2: Update GitHub Actions Workflow

The workflow file `.github/workflows/release.yml` is already configured! It includes:

```yaml
- name: Create .env file from secrets
  run: |
    echo "VITE_FB_API_KEY=${{ secrets.VITE_FB_API_KEY }}" >> .env
    echo "VITE_FB_AUTH_DOMAIN=${{ secrets.VITE_FB_AUTH_DOMAIN }}" >> .env
    echo "VITE_FB_PROJECT_ID=${{ secrets.VITE_FB_PROJECT_ID }}" >> .env
    echo "VITE_FB_STORAGE_BUCKET=${{ secrets.VITE_FB_STORAGE_BUCKET }}" >> .env
    echo "VITE_FB_MESSAGING_SENDER_ID=${{ secrets.VITE_FB_MESSAGING_SENDER_ID }}" >> .env
    echo "VITE_FB_APP_ID=${{ secrets.VITE_FB_APP_ID }}" >> .env
    echo "VITE_FB_COMPANY_ID=${{ secrets.VITE_FB_COMPANY_ID }}" >> .env
```

This creates the `.env` file ONLY during the CI/CD build, never in git.

---

## 🏗️ Complete CI/CD Workflow

### How It Works

1. **Trigger**: Push a git tag (e.g., `v2.0.0`) or push to `main` branch
2. **Create Release**: GitHub creates a draft release with auto-generated notes
3. **Build Windows**: Compiles Tauri app on Windows runner with `.env` from secrets
4. **Build Linux**: Compiles Tauri app on Linux runner with `.env` from secrets
5. **Sign Builds**: Uses Tauri signing keys to create signed installers
6. **Upload Artifacts**: Uploads `.exe`, `.msi`, `.AppImage`, `.deb`, `.rpm` to release
7. **Generate `latest.json`**: Creates updater manifest with signatures and URLs
8. **Publish Release**: Marks release as published (no longer draft)

### Updated Workflow File

Create or update `.github/workflows/release.yml`:

```yaml
name: Build and Release

on:
  push:
    branches:
      - main
    tags:
      - 'v*'

env:
  CARGO_TERM_COLOR: always

jobs:
  create-release:
    permissions:
      contents: write
    runs-on: ubuntu-latest
    outputs:
      release_id: ${{ steps.create-release.outputs.id }}
      release_upload_url: ${{ steps.create-release.outputs.upload_url }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Get version from package.json
        id: get_version
        run: |
          VERSION=$(node -p "require('./package.json').version")
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Create Release
        id: create-release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ steps.get_version.outputs.version }}
          name: HRM System v${{ steps.get_version.outputs.version }}
          body_path: ./RELEASE_NOTES_v${{ steps.get_version.outputs.version }}.md
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  build-tauri:
    needs: create-release
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: ubuntu-22.04
            args: ''
          - platform: windows-latest
            args: ''

    runs-on: ${{ matrix.platform }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install dependencies (Ubuntu only)
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable

      - name: Rust cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: './src-tauri -> target'

      - name: Install frontend dependencies
        run: npm ci

      - name: Create .env file from secrets
        shell: bash
        run: |
          echo "VITE_FB_API_KEY=${{ secrets.VITE_FB_API_KEY }}" >> .env
          echo "VITE_FB_AUTH_DOMAIN=${{ secrets.VITE_FB_AUTH_DOMAIN }}" >> .env
          echo "VITE_FB_PROJECT_ID=${{ secrets.VITE_FB_PROJECT_ID }}" >> .env
          echo "VITE_FB_STORAGE_BUCKET=${{ secrets.VITE_FB_STORAGE_BUCKET }}" >> .env
          echo "VITE_FB_MESSAGING_SENDER_ID=${{ secrets.VITE_FB_MESSAGING_SENDER_ID }}" >> .env
          echo "VITE_FB_APP_ID=${{ secrets.VITE_FB_APP_ID }}" >> .env
          echo "VITE_FB_COMPANY_ID=${{ secrets.VITE_FB_COMPANY_ID }}" >> .env

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          releaseId: ${{ needs.create-release.outputs.release_id }}
          args: ${{ matrix.args }}

  update-release:
    needs: [create-release, build-tauri]
    permissions:
      contents: write
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Get version from package.json
        id: get_version
        run: |
          VERSION=$(node -p "require('./package.json').version")
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Download release assets
        uses: robinraju/release-downloader@v1
        with:
          tag: v${{ steps.get_version.outputs.version }}
          fileName: '*'
          out-file-path: 'release-assets'

      - name: Generate latest.json for updater
        run: |
          VERSION=${{ steps.get_version.outputs.version }}
          cd release-assets
          
          # Get Windows signature (NSIS zip bundle)
          WIN_SIG=""
          WIN_URL=""
          if [ -f "HRM.System_${VERSION}_x64-setup.nsis.zip.sig" ]; then
            WIN_SIG=$(cat "HRM.System_${VERSION}_x64-setup.nsis.zip.sig")
            WIN_URL="https://github.com/${{ github.repository }}/releases/download/v${VERSION}/HRM.System_${VERSION}_x64-setup.nsis.zip"
          elif [ -f "HRM.System_${VERSION}_x64_en-US.msi.zip.sig" ]; then
            WIN_SIG=$(cat "HRM.System_${VERSION}_x64_en-US.msi.zip.sig")
            WIN_URL="https://github.com/${{ github.repository }}/releases/download/v${VERSION}/HRM.System_${VERSION}_x64_en-US.msi.zip"
          fi
          
          # Get Linux signature (AppImage tar.gz bundle)
          LINUX_SIG=""
          LINUX_URL=""
          if [ -f "HRM.System_${VERSION}_amd64.AppImage.tar.gz.sig" ]; then
            LINUX_SIG=$(cat "HRM.System_${VERSION}_amd64.AppImage.tar.gz.sig")
            LINUX_URL="https://github.com/${{ github.repository }}/releases/download/v${VERSION}/HRM.System_${VERSION}_amd64.AppImage.tar.gz"
          fi
          
          cd ..
          
          # Create latest.json
          cat > latest.json << EOF
          {
            "version": "${VERSION}",
            "notes": "See release notes: https://github.com/${{ github.repository }}/releases/tag/v${VERSION}",
            "pub_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
            "platforms": {
              "windows-x86_64": {
                "signature": "${WIN_SIG}",
                "url": "${WIN_URL}"
              },
              "linux-x86_64": {
                "signature": "${LINUX_SIG}",
                "url": "${LINUX_URL}"
              }
            }
          }
          EOF

      - name: Upload latest.json to release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ steps.get_version.outputs.version }}
          files: latest.json
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 🔑 Required GitHub Secrets

### Firebase Secrets (Required for Build)

Add these to **Settings → Secrets and variables → Actions**:

- `VITE_FB_API_KEY`
- `VITE_FB_AUTH_DOMAIN`
- `VITE_FB_PROJECT_ID`
- `VITE_FB_STORAGE_BUCKET`
- `VITE_FB_MESSAGING_SENDER_ID`
- `VITE_FB_APP_ID`
- `VITE_FB_COMPANY_ID`

### Tauri Signing Secrets (Optional but Recommended)

For signed installers and auto-updates:

1. Generate signing keys locally:
```bash
cd src-tauri
npm install -g @tauri-apps/cli
tauri signer generate -w ~/.tauri/myapp.key
```

2. This creates:
   - Private key file: `~/.tauri/myapp.key`
   - Public key: shown in terminal (also in `tauri.conf.json`)

3. Add to GitHub Secrets:
   - `TAURI_SIGNING_PRIVATE_KEY`: Contents of `~/.tauri/myapp.key`
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Password if you set one

4. Update `tauri.conf.json`:
```json
{
  "plugins": {
    "updater": {
      "pubkey": "YOUR_PUBLIC_KEY_HERE",
      "endpoints": [
        "https://github.com/YourUsername/YourRepo/releases/latest/download/latest.json"
      ]
    }
  }
}
```

---

## 📦 Release Process

### Automated Release (Recommended)

1. **Update version** in `src/config/appConfig.ts`:
```typescript
export const APP_CONFIG = {
  // ...
  version: "2.0.0", // Change this
};
```

2. **Commit changes**:
```bash
git add src/config/appConfig.ts
git commit -m "Bump version to 2.0.0"
```

3. **Create and push git tag**:
```bash
git tag v2.0.0
git push origin main
git push origin v2.0.0
```

4. **GitHub Actions automatically**:
   - Creates release
   - Builds Windows and Linux installers
   - Signs the builds
   - Uploads artifacts
   - Generates `latest.json` for updater
   - Publishes release

### Manual Release (Alternative)

If secrets aren't set up yet:

1. Build locally with `.env` file present
2. Create release manually on GitHub
3. Upload `.exe`, `.AppImage`, `.deb`, `.rpm` files
4. Generate `latest.json` manually or skip auto-updates

---

## 🧪 Testing CI/CD Before Release

### Test on a Branch

1. Create a test branch:
```bash
git checkout -b test-ci-cd
```

2. Push to trigger workflow:
```bash
git push origin test-ci-cd
```

3. Check **Actions** tab in GitHub to see build logs

4. Fix any errors, commit, and push again

5. Once working, merge to `main` and create tag

---

## 🚨 Common Issues

### Issue 1: "Cannot find .env file" Error

**Cause**: GitHub Secrets not set or workflow step missing

**Fix**: 
- Ensure all `VITE_FB_*` secrets are added in GitHub
- Verify "Create .env file from secrets" step exists in workflow

### Issue 2: Build Fails on Windows

**Cause**: Different line endings or path separators

**Fix**: Use `shell: bash` in .env creation step (already in workflow above)

### Issue 3: Signature Files Missing

**Cause**: Tauri signing keys not configured

**Fix**: 
- Add `TAURI_SIGNING_PRIVATE_KEY` and password to GitHub Secrets
- Or remove signing requirement from `tauri.conf.json`

### Issue 4: "Permission denied" on Release Upload

**Cause**: `GITHUB_TOKEN` lacks write permissions

**Fix**: Add `permissions: contents: write` to job (already in workflow above)

---

## 📊 Monitoring Builds

### View Build Logs

1. Go to **Actions** tab in GitHub repository
2. Click on the workflow run
3. Click on job name (e.g., "build-tauri (windows-latest)")
4. Expand steps to see detailed logs

### Debug Failed Builds

1. Check error message in logs
2. Common causes:
   - Missing secrets
   - TypeScript compilation errors
   - Rust compilation errors
   - Network timeouts (deps download)
3. Fix locally first, then push again

---

## ✅ Best Practices

1. **Never commit `.env`** - Always use GitHub Secrets
2. **Test locally first** - Run `npm run build` and `npm run tauri build` before pushing
3. **Use semantic versioning** - `v2.0.0`, `v2.1.0`, `v2.1.1`
4. **Write release notes** - Update `RELEASE_NOTES_v{VERSION}.md`
5. **Sign your builds** - Configure Tauri signing for security
6. **Monitor builds** - Check Actions tab after each push
7. **Keep secrets updated** - Rotate Firebase keys periodically

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Tauri CI/CD Guide](https://tauri.app/v1/guides/building/ci/)
- [GitHub Secrets Management](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Tauri Code Signing](https://tauri.app/v1/guides/distribution/sign-windows)

---

## 🎯 Summary Checklist

- [ ] Add all `VITE_FB_*` secrets to GitHub repository
- [ ] (Optional) Generate and add Tauri signing keys
- [ ] Update `.github/workflows/release.yml` with .env creation step
- [ ] Test CI/CD on a test branch first
- [ ] Update version in `src/config/appConfig.ts`
- [ ] Create git tag and push
- [ ] Monitor build in Actions tab
- [ ] Verify release artifacts are uploaded correctly
- [ ] Test installers on Windows and Linux
- [ ] Announce release to users

**With this setup, your builds are fully automated and secure! 🚀**
