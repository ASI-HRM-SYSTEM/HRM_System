# Using This Project as a Template

> **Quick reference: How to clone and customize this HRM system for your organization.**

## 🚀 Quick Start

### 1. Clone as Template
```bash
git clone https://github.com/ASI-HRM-SYSTEM/HRM_System.git my-company-hrm
cd my-company-hrm
```

### 2. Run Interactive Setup (RECOMMENDED)
```bash
npm run setup-template
```
This wizard will ask 5 questions and auto-configure everything. **[Planned for v2.1.0]**

### 3. Manual Setup (Current)
Edit these 2 files:

**File 1: `src/config/appConfig.ts`**
```typescript
export const APP_CONFIG = {
  name: "HRM System",
  companyName: "YOUR COMPANY NAME",  // ← Change
  version: "1.0.0",
  developerName: "YOUR NAME",         // ← Change
  linkedinUrl: "https://linkedin.com/in/yourprofile", // ← Change
};
```

**File 2: `.env`**
```bash
VITE_FB_API_KEY=YOUR_FIREBASE_API_KEY
VITE_FB_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FB_PROJECT_ID=YOUR_PROJECT_ID
VITE_FB_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
VITE_FB_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FB_APP_ID=YOUR_APP_ID
VITE_FB_COMPANY_ID=unique_identifier
```

### 4. Install & Build
```bash
npm install
npm run tauri build
```

## ✅ What's Already Modularized

- **Company Branding:** Change once in `appConfig.ts` → auto-updates everywhere (Sidebar, About page, Login, Footer, etc.)
- **Firebase Config:** All API keys isolated in `.env` (never in code)
- **Versions:** Auto-synced across package.json, Cargo.toml, UI components

## 📚 Complete Guides

1. **[TEMPLATE_SETUP_GUIDE.md](./TEMPLATE_SETUP_GUIDE.md)** - Comprehensive setup with 5-min quick start and detailed customization checklist

2. **[FIREBASE_STRATEGY.md](./FIREBASE_STRATEGY.md)** - Firebase account management, account continuity, backup strategies, offline database planning

3. **[LOCAL_DATABASE_IMPLEMENTATION.md](./LOCAL_DATABASE_IMPLEMENTATION.md)** - Roadmap for offline-first architecture with local SQLite fallback (planned v2.1.0+)

4. **[TEMPLATE_ONBOARDING_DESIGN.md](./TEMPLATE_ONBOARDING_DESIGN.md)** - Design for interactive setup wizard (planned v2.1.0+)

## 🎯 For Your New Repo

Since you created: `https://github.com/AsithaKanchana1/New-Lanka-Clothing.pvt-ltd-.git`

1. Clone this template:
   ```bash
   git clone https://github.com/ASI-HRM-SYSTEM/HRM_System.git
   ```

2. Configure for your company (follow steps above)

3. Push to your repo:
   ```bash
   git remote set-url origin https://github.com/AsithaKanchana1/New-Lanka-Clothing.pvt-ltd-.git
   git push origin main
   ```

4. (Coming v2.1.0) Add setup instructions to your README so others can clone and configure

## 🔑 Firebase Account Best Practices

**Your Current Situation:**
- Using Google Workspace Education (Student account)
- Free Spark plan (~50K reads/day - plenty for hundreds of employees)

**Risk:** Student account expires when you graduate

**Mitigation:**
```
Timeline: When graduating or before account expiration
├─ Option 1: Migrate to personal Firebase account (free Spark plan)
├─ Option 2: Upgrade to Blaze pay-as-you-go (~$0 if under quota)
└─ Option 3: Use company account when launching commercial version

Action: See FIREBASE_STRATEGY.md for complete plan
```

## 💾 Offline-First Architecture (Planned)

**Current:** App requires Firebase connection

**Planned v2.2.0:** Local SQLite fallback
- App works offline (reads from cached SQLite)
- Changes queue locally
- Auto-sync when online

**See:** [LOCAL_DATABASE_IMPLEMENTATION.md](./LOCAL_DATABASE_IMPLEMENTATION.md)

## 📋 Configuration Checklist

- [ ] Update `src/config/appConfig.ts` with your company info
- [ ] Create Firebase project at [firebase.google.com](https://firebase.google.com)
- [ ] Update `.env` with Firebase credentials
- [ ] Update `src-tauri/tauri.conf.json` productName & identifier
- [ ] (Optional) Replace logo in `public/`
- [ ] Test: `npm run tauri dev`
- [ ] Build: `npm run tauri build`
- [ ] Push to your GitHub repo

## 🤔 Common Questions

**Q: Is all company-specific data in `appConfig.ts`?**
A: Yes! ✅ Version, company name, developer info, copyright text. Single source of truth.

**Q: Do I need to edit source code?**
A: No! Just 2 files: `appConfig.ts` and `.env`

**Q: Can I use my own Firebase account?**
A: Yes! Create new project at firebase.google.com and copy credentials to `.env`

**Q: What happens when I clone this as template for another company?**
A: Make a new copy, change `appConfig.ts` and `.env`, push to new repo. Done! ✅

**Q: Why is .env committed to this repo?**
A: For template demo only. In production, `.env` is in `.gitignore` and loaded from GitHub Secrets or environment variables.

## 🔐 Security Notes

- `.env` is in `.gitignore` by default (won't commit)
- Never push Firebase credentials to GitHub
- Use GitHub Secrets for CI/CD (see CI_CD_SETUP.md)
- Review Firestore security rules before production

## 📞 Need Help?

See documentation:
- [TEMPLATE_SETUP_GUIDE.md](./TEMPLATE_SETUP_GUIDE.md) → Setup & customization
- [FIREBASE_STRATEGY.md](./FIREBASE_STRATEGY.md) → Firebase account & backup
- [LOCAL_DATABASE_IMPLEMENTATION.md](./LOCAL_DATABASE_IMPLEMENTATION.md) → Offline support
- [TEMPLATE_ONBOARDING_DESIGN.md](./TEMPLATE_ONBOARDING_DESIGN.md) → Interactive wizard (future)
- [README.md](./README.md) → General info
- [docs/](./docs/) → Technical documentation

---

**Version:** 2.0.0  
**Last Updated:** March 7, 2026
