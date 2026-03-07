# Template Project Setup Guide

> **This project is designed as a reusable template for HR Management Systems.** Follow this guide to customize it for your organization.

## ⚡ Quick Start (5 Minutes)

### 1. Clone as Template
```bash
git clone https://github.com/ASI-HRM-SYSTEM/HRM_System.git my-company-hrm
cd my-company-hrm
```

### 2. Update Company Configuration (Single File!)
Edit `src/config/appConfig.ts`:
```typescript
export const APP_CONFIG = {
  name: "Your Company HRM",              // ← Change this
  companyName: "Your Company (Pvt) Ltd", // ← Change this
  version: "1.0.0",
  developerName: "Your Name",            // ← Change this
  linkedinUrl: "https://linkedin.com/in/yourprofile", // ← Change this
};

export const LEGAL_CONFIG = {
  termsVersion: "1.0.0",
  licenseSummary: "© 2026 Your Company (Pvt) Ltd. All rights reserved."
};
```

### 3. Update Firebase Configuration
Edit `.env`:
```bash
VITE_FB_API_KEY=your_new_api_key
VITE_FB_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FB_PROJECT_ID=your-project-id
VITE_FB_STORAGE_BUCKET=your-project.appspot.com
VITE_FB_MESSAGING_SENDER_ID=your-sender-id
VITE_FB_APP_ID=your-app-id
VITE_FB_COMPANY_ID=your-unique-company-identifier
```

### 4. Update Project Branding
File: `src-tauri/tauri.conf.json`
```json
{
  "productName": "Your Company HRM",
  "identifier": "com.yourcompany.hrm"
}
```

### 5. Install & Build
```bash
npm install
npm run tauri build
```

**That's it!** ✅ Your version is now ready.

---

## 📋 Customization Checklist

This checklist ensures nothing is missed when adapting the template:

### Core Configuration Files
- [ ] `src/config/appConfig.ts` - Company name, version, developer info
- [ ] `.env` - Firebase credentials (new project)
- [ ] `src-tauri/tauri.conf.json` - Product name, identifier
- [ ] `package.json` - name, version, description
- [ ] `src-tauri/Cargo.toml` - name, version, description

### Branding & UI
- [ ] Update `public/` folder with your company favicon/logo
- [ ] Update `src/index.css` color scheme (optional - uses Tailwind)
- [ ] Review all employee form fields in `src/controllers/EmployeeController.ts`
- [ ] Customize dashboard widgets in `src/components/Dashboard.tsx`

### Firebase Setup
- [ ] Create new Firebase project at [firebase.google.com](https://firebase.google.com)
- [ ] Enable Authentication (Google OAuth 2.0)
- [ ] Create Firestore database (start in test mode for development)
- [ ] Copy credentials to `.env` file
- [ ] Create database security rules in `firestore.rules`

### Git Setup
- [ ] Change git remote: `git remote set-url origin <your-repo-url>`
- [ ] Update git user: `git config user.name "Your Name"` and `git config user.email "you@company.com"`
- [ ] Create `.gitignore` (already exists, but verify `.env` is included)
- [ ] Make initial commit on new repo

### CI/CD Pipeline (GitHub Actions)
- [ ] Go to GitHub repo → Settings → Secrets and variables → Actions
- [ ] Add Firebase secrets from `.env`:
  ```
  VITE_FB_API_KEY
  VITE_FB_AUTH_DOMAIN
  VITE_FB_PROJECT_ID
  VITE_FB_STORAGE_BUCKET
  VITE_FB_MESSAGING_SENDER_ID
  VITE_FB_APP_ID
  VITE_FB_COMPANY_ID
  ```
- [ ] Push a tag to trigger automated build: `git tag v1.0.0 && git push origin v1.0.0`
- [ ] Monitor GitHub Actions → Releases tab for built installers

### Documentation
- [ ] Update `README.md` with your company info
- [ ] Update `PROJECT_DOCS.md` with your requirements
- [ ] Create `DEPLOYMENT.md` with your deployment process

### Testing
- [ ] [ ] Test Google OAuth login flow
- [ ] [ ] Test employee creation/editing
- [ ] [ ] Test audit logging
- [ ] [ ] Test export functionality
- [ ] [ ] Test on Windows (exe, msi) and Linux (AppImage, deb, rpm)

---

## 🔧 What's Modularized

### ✅ Already Modular (No Changes Needed)

**Company Branding:**
- Company name appears in 13+ locations automatically from `APP_CONFIG`
- Change once in `appConfig.ts` → updates everywhere (About page, Login, Footer, etc.)

**Firebase Configuration:**
- All Firebase keys isolated in `.env`
- Wrapped in `src/config/env.ts` for clean separation
- CI/CD pipeline injects from GitHub Secrets automatically
- No hardcoded credentials anywhere

**Version Management:**
- Version defined once in `APP_CONFIG`
- Auto-synced to:
  - Sidebar display
  - About page
  - Terms & Conditions
  - GitHub Release notes

**Authentication:**
- Google OAuth 2.0 configured via Firebase
- Multi-factor authentication (MFA) via Google Authenticator
- One-time device verification (can be disabled)

**Data Models:**
- Employee schema in `src/models/Employee.ts`
- User roles in `src/models/User.ts`
- Easily extendable for custom fields

---

## 🚀 Deployment Variations

### Variation 1: Single Company (Your Setup)
- One Firebase project
- One deployed application
- One database per company
- **Best for:** Single organization

### Variation 2: Multi-Tenant
- One Firebase project
- One deployed application  
- Multiple databases (Firestore collections per tenant)
- Dynamic company selection via URL or login redirect
- **Best for:** SaaS platforms

### Variation 3: Distributed Instances
- Each company gets own Firebase project
- Each company gets own deployed application
- Completely isolated data & infrastructure
- **Best for:** Franchises, resellers, white-label

---

## ❓ Frequently Asked Questions

### Q: Can I use my own logo?
**A:** Yes! Replace files in `public/` folder:
- `icon.png` - App icon
- `favicon.ico` - Browser tab icon
- Update image URLs in `src/components/Login.tsx`

### Q: How do I change the color scheme?
**A:** Edit `tailwind.config.js` to customize Tailwind colors, or modify `src/index.css` for custom CSS.

### Q: Can I add more employee fields?
**A:** Yes! 
1. Update `src/models/Employee.ts` (add new properties)
2. Update `src/components/EmployeeForm.tsx` (add form fields)
3. Update `src/services/EmployeeService.ts` (handle new fields)
4. Update `src/controllers/EmployeeController.ts` (validation)

### Q: How do I customize the sidebar menu?
**A:** Edit `src/components/Sidebar.tsx`:
- Extend `PageType` enum with new pages
- Add new menu items to sidebar JSX

### Q: Can I host this on my own server?
**A:** This is a **desktop application** (Tauri), not web-hosted. It runs on user's machine. Firebase handles data backend.

For web version, you'd need:
- Node.js/Express server
- Different authentication flow
- Different deployment strategy

---

## 🔐 Security Best Practices

1. **Never commit .env to git** ✅ Already in .gitignore
2. **Use GitHub Secrets for CI/CD** → Automatic in workflow
3. **Enable Firestore security rules** → Require authentication
4. **Rotate Firebase keys periodically** → Every 6 months
5. **Use environment variable per deployment** → Dev/Staging/Production
6. **Enable audit logging** → Already implemented
7. **Backup Firestore database** → Use Firebase backup feature

---

## 📞 Support

For issues or customization help:
1. Check `docs/` folder for implementation guides
2. Review Firebase documentation: [firebase.google.com/docs](https://firebase.google.com/docs)
3. Tauri documentation: [tauri.app/](https://tauri.app/)
4. React documentation: [react.dev](https://react.dev)

---

## 📦 Version Tracking

Current Template Version: **2.0.0**

Update format: `MAJOR.MINOR.PATCH`
- **MAJOR**: Breaking changes (new Tauri version, major architecture change)
- **MINOR**: New features (new employee fields, new pages)
- **PATCH**: Bug fixes & improvements

When updating: Only change `src/config/appConfig.ts` version field, then run `npm run tauri build`.
