# HRM System v2.0.0 Release Notes

**Release Date:** March 7, 2026  
**Platform:** Windows, Linux (AppImage, Deb, RPM)  
**Company:** New Lanka Clothing (Pvt) Ltd

---

## 🎉 Major Features

### ✅ Google Authentication Integration (MFA-Ready)
- **Secure Google Sign-In** for authorized company accounts
- **Email allowlist verification** via Firebase Firestore
- **External browser OAuth flow** for maximum compatibility
- **One-time device verification** - no need to re-authenticate every time
- **Automatic token refresh** with persistent sessions
- Solved multiple authentication challenges:
  - Popup blocker bypassed with button-triggered flow
  - Redirect loop resolved with proper Google OAuth token extraction
  - Seamless desktop app integration via local TCP server

### 📋 About & Terms Pages
- **About section** with app details, version info, and copyright
- **Terms & Conditions** with comprehensive legal framework:
  - Software usage agreement
  - Ownership & copyright protection
  - Developer rights and permitted personal use
  - Data privacy & security guidelines
  - Warranty disclaimer and liability limits
- **Auto-synced version numbers** from centralized config
- Easy access via sidebar navigation

### 🏗️ Modular Architecture Improvements
- **Centralized app configuration** (`src/config/appConfig.ts`)
  - Single source of truth for app name, company name, version
  - Developer info and legal terms in one place
- **Environment variable isolation** (`src/config/env.ts`)
  - Clean separation of Firebase and other service configs
  - Easier to manage secrets for CI/CD
- **Auto-updating version display** across all UI components
- **Reduced code duplication** and improved maintainability

---

## 🔧 Technical Improvements

### Authentication Flow
- Firebase Auth v11.4.0 integration
- `signInWithPopup` with manual user interaction (no popup blockers)
- `GoogleAuthProvider.credentialFromResult()` for proper OAuth token extraction
- Local TCP server (port 43189) for Tauri desktop app OAuth callback
- Persistent auth state with `onAuthStateChanged` listener
- Firebase token vs Google OAuth token distinction resolved

### Code Organization
- MVC architecture foundation in place
- Service layer for Firebase operations (`FirebaseSyncService`)
- Centralized controllers (`AuthController`, `EmployeeController`)
- Type-safe models (`Employee`, `User`, `Common` types)
- Separation of concerns: UI → Controller → Service → Model

### UI/UX Enhancements
- Consistent branding across all screens
- Improved error messages for auth failures
- Loading states for better user feedback
- Gradient backgrounds and modern design language
- Responsive layouts for different screen sizes

---

## 📦 What's Included

### Core Features (Existing)
- ✅ **Employee Management** - Add, edit, delete employee records
- ✅ **Dashboard** - Overview of employee statistics and system status
- ✅ **Cader Reports** - Detailed employee cader analysis and export
- ✅ **User Management** - Role-based access control (Admin, HR Manager, HR Staff, Viewer)
- ✅ **Database Backup** - Export employee data to CSV/HTML/JSON
- ✅ **Audit Logs** - Track all system activities and changes
- ✅ **Update Checker** - Automatic update notifications via GitHub releases

### New Features (v2.0.0)
- ✅ **Google Authentication** - Secure, company-authorized access
- ✅ **About Page** - App info, version, copyright details
- ✅ **Terms & Conditions** - Legal framework and usage policies
- ✅ **Modular Config** - Centralized app metadata and environment management

---

## 🔐 Security & Privacy

- **Google OAuth 2.0** for authentication
- **Email allowlist** verification (only authorized accounts can access)
- **Firebase security rules** for data access control
- **Local SQLite database** for offline employee data storage
- **No sensitive data** in version control (.env files excluded)
- **Signed installers** with Tauri code signing (Windows/Linux)

---

## 📋 System Requirements

### Windows
- Windows 10 (1909 or later) / Windows 11
- WebView2 Runtime (auto-installed if missing)
- 4 GB RAM minimum, 8 GB recommended
- 200 MB disk space

### Linux
- Ubuntu 22.04+ / Debian 11+ / Fedora 36+
- GTK 3.0 / WebKit2GTK 4.1
- 4 GB RAM minimum, 8 GB recommended
- 200 MB disk space

---

## 📥 Installation

### Windows
1. Download `HRM.System_2.0.0_x64-setup.exe`
2. Run the installer and follow the prompts
3. Launch "HRM System" from Start Menu
4. Sign in with your authorized Google account
5. Complete local HRM login with your credentials

### Linux (AppImage)
1. Download `HRM.System_2.0.0_amd64.AppImage`
2. Make it executable: `chmod +x HRM.System_2.0.0_amd64.AppImage`
3. Run: `./HRM.System_2.0.0_amd64.AppImage`
4. Sign in with your authorized Google account
5. Complete local HRM login with your credentials

### Linux (Deb)
```bash
sudo dpkg -i HRM.System_2.0.0_amd64.deb
sudo apt-get install -f  # Fix dependencies if needed
hrm-system
```

### Linux (RPM)
```bash
sudo rpm -i HRM.System_2.0.0_x86_64.rpm
hrm-system
```

---

## 🐛 Known Issues & Limitations

- **First Launch**: Google sign-in opens in external browser (by design for security)
- **Popup Blockers**: Ensure popups are allowed for localhost in browser settings
- **macOS**: Not yet supported (planned for future release)
- **Offline Mode**: Requires internet connection for initial Google authentication

---

## 🔄 Upgrade Notes

### From v1.x to v2.0.0

**Breaking Changes:**
- **Google Authentication Now Required** (unless Firebase is not configured)
- Users must be added to the email allowlist in Firebase Console
- First-time users will need to complete Google OAuth flow

**Data Migration:**
- Employee data in SQLite database is fully compatible
- No manual migration needed
- Backup your database before upgrading (recommended)

**Configuration:**
- New `.env` variables required for Firebase (see `.env.example`)
- Update `VITE_FB_*` environment variables for your Firebase project

---

## 🚀 What's Next (v2.1.0 Roadmap)

- [ ] **Multi-Factor Authentication (MFA)** - TOTP and SMS OTP
- [ ] **Leave Management** - Leave requests, approvals, balances
- [ ] **Attendance Tracking** - Fingerprint data import, daily attendance
- [ ] **Payroll Module** - Salary calculation, payslips, payroll reports
- [ ] **Job Desk Management** - Departments, designations, org chart
- [ ] **Mobile App** - React Native companion app for field access

---

## 📚 Documentation

- [Google Auth Fix Documentation](../docs/GOOGLE_AUTH_FIX.md) - Detailed troubleshooting guide
- [MFA Implementation Plan](../docs/MFA_IMPLEMENTATION.md) - Future MFA roadmap
- [Implementation Plan](../docs/IMPLEMENTATION_PLAN.md) - Development timeline
- [Bug Reports](../docs/BUG_REPORTS.md) - Known issues and resolutions

---

## 🤝 Support

For issues, questions, or feature requests:
1. Check the documentation in the `docs/` folder
2. Review [Google Auth Fix](../docs/GOOGLE_AUTH_FIX.md) for authentication problems
3. Contact New Lanka Clothing IT department for access-related issues
4. Report bugs via GitHub Issues (if repository is public)

---

## 👨‍💻 Credits

**Developer:** Asitha Kanchana  
**LinkedIn:** [linkedin.com/in/asithakanchana](https://www.linkedin.com/in/asithakanchana)  
**Client:** New Lanka Clothing (Pvt) Ltd

---

## 📄 License

This software is developed for New Lanka Clothing (Pvt) Ltd. See Terms & Conditions within the application for detailed usage rights and restrictions.

© 2026 New Lanka Clothing (Pvt) Ltd. All rights reserved.

---

**Thank you for using HRM System v2.0.0!**

For the best experience, ensure you're using the latest version by enabling automatic updates in the application settings.
