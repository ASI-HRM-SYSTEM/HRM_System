# HRM System Template

A cross-platform desktop HR management template built with Tauri, React, and SQLite. This repository is the generic/open-source base and is intended to be customized with your own branding, company details, and release settings.

## 📥 Releases

Build and publish your own branded releases from this template. Update the repository links, app branding, updater keys, and GitHub Actions secrets before distributing installers.

### Installation Instructions

#### Windows
1. Download the `.msi` installer
2. Double-click the downloaded file
3. Follow the installation wizard
4. Launch "HRM System" from the Start Menu

#### Linux (Debian/Ubuntu)
```bash
# Download and install the .deb package
sudo dpkg -i hrm-system_1.0.0_amd64.deb

# If there are dependency issues, run:
sudo apt-get install -f
```

#### Linux (AppImage)
```bash
# Make the AppImage executable
chmod +x hrm-system_1.0.0_amd64.AppImage

# Run the application
./hrm-system_1.0.0_amd64.AppImage
```

## Features

- 👥 **Employee Management**: Add, edit, delete, and search employees
- 🛡️ **Identifier Validation**: EPF Number and NIC Number are required and duplicate values are blocked
- 📊 **Dashboard**: Overview of employee statistics
- 🔍 **Advanced Filters**: Search employees by EPF, NIC, name, phone, department, designation, route, address, and more
- 💾 **Local Database**: SQLite database stored locally
- 🔄 **Auto-Update**: Automatic updates from GitHub Releases
- 🖥️ **Cross-Platform**: Works on Windows and Linux

## Branding Notes

- Replace placeholder values in [src/config/appConfig.ts](src/config/appConfig.ts)
- Replace or customize the generic template branding in the login screen, sidebar, exported reports, and PDFs
- Add your own logo asset if you want image-based branding instead of the default generic icon blocks

## 🛠️ Development Setup

If you want to run or modify the source code:

## 🛠️ Development Setup

If you want to run or modify the source code:

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Linux Dependencies

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

### Running from Source

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd HRM_System
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run tauri dev
   ```

4. **Build for production**
   ```bash
   npm run tauri build
   ```

## Auto-Update Setup

To enable auto-updates, you need to generate signing keys:

1. **Generate signing keys**
   ```bash
   npm run tauri signer generate -- -w ~/.tauri/hrm_system.key
   ```

2. **Add the public key** to `src-tauri/tauri.conf.json`:
   ```json
   {
     "plugins": {
       "updater": {
         "pubkey": "YOUR_PUBLIC_KEY_HERE"
       }
     }
   }
   ```

3. **Add secrets to GitHub**:
   - `TAURI_SIGNING_PRIVATE_KEY`: The contents of your private key file
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: The password you used (if any)

4. **Update the endpoint URL** in `tauri.conf.json` with your GitHub username/repo

## Project Structure

```
HRM_System/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── types/             # TypeScript types
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── src-tauri/             # Tauri backend (Rust)
│   ├── src/
│   │   ├── main.rs        # Tauri entry point
│   │   ├── lib.rs         # Database initialization
│   │   ├── commands.rs    # Tauri commands
│   │   └── models.rs      # Data models
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
└── .github/workflows/     # GitHub Actions
    └── release.yml        # Auto-build and release
```

## Database Schema

The SQLite database stores employee information with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| epf_number | TEXT | Primary Key - Employee Provident Fund Number |
| name_with_initials | TEXT | Name with initials (e.g., K.A.S. Perera) |
| full_name | TEXT | Full name |
| dob | TEXT | Date of birth |
| police_area | TEXT | Police area/jurisdiction |
| transport_route | TEXT | Transport route for factory bus |
| mobile_1 | TEXT | Primary mobile number |
| mobile_2 | TEXT | Secondary mobile number |
| address | TEXT | Home address |
| date_of_join | TEXT | Employment start date |
| date_of_resign | TEXT | Resignation date (if applicable) |
| working_status | TEXT | 'active' or 'resign' |
| marital_status | TEXT | Marital status |
| job_role | TEXT | Job role/position |
| department | TEXT | Department name |
| created_at | TEXT | Record creation timestamp |

## License

Use the license that matches your project. Review all placeholder legal text before publishing a customized build.
