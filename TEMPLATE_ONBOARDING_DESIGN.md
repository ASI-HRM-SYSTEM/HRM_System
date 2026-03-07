# Template Onboarding Flow Design

> **Designing an interactive setup wizard for first-time template users to automatically configure their company branding and Firebase settings.**

---

## 🎯 Vision

**Current Manual Process (Tedious):**
```
1. Clone repo
2. Edit appConfig.ts (company name, etc)
3. Edit .env (Firebase keys)
4. Edit tauri.conf.json (identifier)
5. Run npm install
6. Run npm run tauri build
TOTAL TIME: ~30 minutes (for non-developers: hours)
```

**Proposed Automated Process (Easy):**
```
1. Clone repo
2. Run: npm run setup-template
3. Interactive wizard asks 5 questions:
   - Company name?
   - Company email?
   - Firebase project ID?
   - Firebase API key?
   - Logo file (optional)?
4. Files auto-updated
5. Ready to build! ✅
TOTAL TIME: ~5 minutes
```

---

## 🧙 Setup Wizard Design

### UX Flow

```
Welcome to HRM Template Setup
════════════════════════════════════════

Step 1/5: Company Information
? Company Name: New Lanka Clothing (Pvt) Ltd

Step 2/5: Developer Information  
? Your Full Name: Asitha Kanchana
? LinkedIn URL: https://linkedin.com/in/asithakanchana

Step 3/5: Firebase Configuration
? Firebase Project ID: my-hrm-project
? Firebase API Key: AIzaSy...
? Firebase Auth Domain: my-hrm-project.firebaseapp.com
? More Firebase settings? (Press Enter to continue)

Step 4/5: Branding (Optional)
? Company Logo (.png): ./my-logo.png [SKIP]
? Color Theme (Default/Dark/Custom): Default

Step 5/5: Review
Company: New Lanka Clothing (Pvt) Ltd
Firebase Project: my-hrm-project
Ready to finalize? (y/n) y

✅ Configuration saved!
Next steps:
  npm install
  npm run tauri build
════════════════════════════════════════
```

---

## 📦 Implementation Components

### 1. Setup Script
```bash
# scripts/setup-template.sh
#!/bin/bash

echo "🚀 HRM Template Setup Wizard"
echo ""

# Check if already configured
if [ -f ".template-configured" ]; then
    echo "✅ Already configured. Run 'npm run setup-template --reset' to reconfigure."
    exit 0
fi

# Interactive input
read -p "Company Name: " COMPANY_NAME
read -p "Your Name: " DEVELOPER_NAME
read -p "LinkedIn URL: " LINKEDIN_URL
read -p "Firebase Project ID: " FB_PROJECT_ID
read -p "Firebase API Key: " FB_API_KEY
read -p "Firebase Auth Domain: " FB_AUTH_DOMAIN
read -p "Firebase Messaging Sender ID: " FB_SENDER_ID
read -p "Firebase App ID: " FB_APP_ID

echo ""
echo "Summary:"
echo "========="
echo "Company: $COMPANY_NAME"
echo "Developer: $DEVELOPER_NAME"
echo "Firebase Project: $FB_PROJECT_ID"
echo ""
read -p "Proceed? (y/n) " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Setup cancelled."
    exit 1
fi

# Update Config Files
update_app_config "$COMPANY_NAME" "$DEVELOPER_NAME" "$LINKEDIN_URL"
update_env_file "$FB_PROJECT_ID" "$FB_API_KEY" "$FB_AUTH_DOMAIN" "$FB_SENDER_ID" "$FB_APP_ID"
update_tauri_config "$COMPANY_NAME"

# Mark as configured
touch .template-configured

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. npm install"
echo "  2. npm run tauri build"
```

### 2. Interactive CLI Tool (Better UX)

```typescript
// scripts/setup-wizard.ts
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';

interface ConfigOptions {
  companyName: string;
  companyEmail: string;
  developerName: string;
  linkedinUrl: string;
  firebaseProjectId: string;
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseSenderId: string;
  firebaseAppId: string;
  firebaseCompanyId: string;
  logoPath?: string;
}

async function runSetupWizard() {
  console.log('\n🚀 HRM System Template Setup Wizard\n');

  // Check if already configured
  if (fs.existsSync('.template-configured')) {
    const { reset } = await inquirer.prompt({
      type: 'confirm',
      name: 'reset',
      message: 'Already configured. Reset and reconfigure?',
      default: false,
    });

    if (!reset) {
      console.log('✅ Keeping existing configuration.\n');
      return;
    }
  }

  // Step 1: Company Information
  const companyInfo = await inquirer.prompt([
    {
      type: 'input',
      name: 'companyName',
      message: 'Company Name:',
      default: 'New Company (Pvt) Ltd',
      validate: (input) => input.length > 0 || 'Company name required',
    },
    {
      type: 'input',
      name: 'companyEmail',
      message: 'Company Email:',
      default: 'info@company.com',
      validate: (input) => 
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input) || 'Invalid email',
    },
  ]);

  // Step 2: Developer Information
  const developerInfo = await inquirer.prompt([
    {
      type: 'input',
      name: 'developerName',
      message: 'Your Full Name (Developer):',
      default: 'Developer Name',
      validate: (input) => input.length > 0 || 'Name required',
    },
    {
      type: 'input',
      name: 'linkedinUrl',
      message: 'LinkedIn Profile URL (optional):',
      default: 'https://linkedin.com/in/yourprofile',
    },
  ]);

  // Step 3: Firebase Configuration
  console.log('\n📱 Firebase Configuration');
  console.log('Get these from: https://console.firebase.google.com/');
  console.log('Project Settings → Service Accounts\n');

  const firebaseConfig = await inquirer.prompt([
    {
      type: 'input',
      name: 'firebaseProjectId',
      message: 'Firebase Project ID:',
      validate: (input) => input.length > 0 || 'Project ID required',
    },
    {
      type: 'password',
      name: 'firebaseApiKey',
      message: 'Firebase Web API Key:',
      validate: (input) => input.length > 0 || 'API Key required',
    },
    {
      type: 'input',
      name: 'firebaseAuthDomain',
      message: 'Firebase Auth Domain:',
      default: (answers: any) => `${answers.firebaseProjectId}.firebaseapp.com`,
    },
    {
      type: 'input',
      name: 'firebaseSenderId',
      message: 'Firebase Messaging Sender ID:',
      validate: (input) => /^\d+$/.test(input) || 'Must be numeric',
    },
    {
      type: 'input',
      name: 'firebaseAppId',
      message: 'Firebase App ID:',
      validate: (input) => input.length > 0 || 'App ID required',
    },
    {
      type: 'input',
      name: 'firebaseCompanyId',
      message: 'Unique Company Identifier (for multi-tenant):',
      default: (answers: any) => 
        answers.firebaseProjectId.toLowerCase().replace(/-/g, '_'),
    },
  ]);

  // Step 4: Branding (Optional)
  const { logoPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'logoPath',
      message: 'Company Logo Path (optional, .png):',
      default: 'SKIP',
    },
  ]);

  // Step 5: Review
  const config: ConfigOptions = {
    ...companyInfo,
    ...developerInfo,
    ...firebaseConfig,
    logoPath: logoPath === 'SKIP' ? undefined : logoPath,
  };

  console.log('\n📋 Configuration Summary');
  console.log('═'.repeat(50));
  console.log(`Company: ${config.companyName}`);
  console.log(`Email: ${config.companyEmail}`);
  console.log(`Developer: ${config.developerName}`);
  console.log(`Firebase Project: ${config.firebaseProjectId}`);
  console.log(`Logo: ${config.logoPath || '(using default)'}`);
  console.log('═'.repeat(50) + '\n');

  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Proceed with setup?',
      default: true,
    },
  ]);

  if (!confirmed) {
    console.log('Setup cancelled.\n');
    process.exit(0);
  }

  // Apply configuration
  await applyConfiguration(config);

  console.log('\n✅ Setup Complete!\n');
  console.log('Next steps:');
  console.log('  1. npm install');
  console.log('  2. npm run tauri dev    (test locally)');
  console.log('  3. npm run tauri build  (production build)\n');
}

async function applyConfiguration(config: ConfigOptions) {
  console.log('\n⚙️  Applying configuration...\n');

  // 1. Update appConfig.ts
  updateAppConfig(config);
  console.log('✅ Updated src/config/appConfig.ts');

  // 2. Update .env
  updateEnvFile(config);
  console.log('✅ Updated .env');

  // 3. Update tauri.conf.json
  updateTauriConfig(config);
  console.log('✅ Updated src-tauri/tauri.conf.json');

  // 4. Update package.json
  updatePackageJson(config);
  console.log('✅ Updated package.json');

  // 5. Copy logo if provided
  if (config.logoPath && config.logoPath !== 'SKIP') {
    copyLogo(config.logoPath);
    console.log('✅ Copied logo to public/');
  }

  // 6. Mark as configured
  fs.writeFileSync('.template-configured', `Configured on ${new Date().toISOString()}\n`);
}

function updateAppConfig(config: ConfigOptions) {
  const template = `export const APP_CONFIG = {
  name: "HRM System",
  companyName: "${config.companyName}",
  version: "1.0.0",
  developerName: "${config.developerName}",
  linkedinUrl: "${config.linkedinUrl}",
};

export const LEGAL_CONFIG = {
  termsVersion: "1.0.0",
  licenseSummary: "© 2026 ${config.companyName}. All rights reserved.",
};`;

  fs.writeFileSync('src/config/appConfig.ts', template);
}

function updateEnvFile(config: ConfigOptions) {
  const envContent = `VITE_FB_API_KEY=${config.firebaseApiKey}
VITE_FB_AUTH_DOMAIN=${config.firebaseAuthDomain}
VITE_FB_PROJECT_ID=${config.firebaseProjectId}
VITE_FB_STORAGE_BUCKET=${config.firebaseProjectId}.appspot.com
VITE_FB_MESSAGING_SENDER_ID=${config.firebaseSenderId}
VITE_FB_APP_ID=${config.firebaseAppId}
VITE_FB_COMPANY_ID=${config.firebaseCompanyId}`;

  fs.writeFileSync('.env', envContent);
  fs.writeFileSync('.env.example', envContent.replace(/=.+/g, '=YOUR_VALUE'));
}

function updateTauriConfig(config: ConfigOptions) {
  const configPath = 'src-tauri/tauri.conf.json';
  const tauriConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  tauriConfig.productName = `${config.companyName} - HRM`;
  tauriConfig.identifier = 
    `com.${config.companyName.toLowerCase().replace(/\s/g, '')}. hrm`;
  
  fs.writeFileSync(configPath, JSON.stringify(tauriConfig, null, 2));
}

function updatePackageJson(config: ConfigOptions) {
  const packagePath = 'package.json';
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

  pkg.name = `hrm-${config.companyName.toLowerCase().replace(/\s/g, '-')}`;
  pkg.description = `HR Management System for ${config.companyName}`;
  pkg.author = config.developerName;
  
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
}

function copyLogo(logoPath: string) {
  const destPath = 'public/company-logo.png';
  
  if (!fs.existsSync(logoPath)) {
    console.warn(`⚠️  Logo file not found: ${logoPath}`);
    return;
  }

  fs.copyFileSync(logoPath, destPath);
}

// Run wizard
runSetupWizard().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});
```

### 3. Add to package.json

```json
{
  "scripts": {
    "setup-template": "ts-node scripts/setup-wizard.ts",
    "setup-template:reset": "rm .template-configured && npm run setup-template"
  },
  "devDependencies": {
    "inquirer": "^8.2.5",
    "ts-node": "^10.9.1"
  }
}
```

---

## 🔄 Workflow for Template Users

### First Time Setup
```bash
# 1. Clone template repo
git clone https://github.com/Your-Org/HRM_System.git my-company-hrm
cd my-company-hrm

# 2. Run setup wizard (interactive)
npm run setup-template

# Wizard automatically:
# ✅ Asks for company info
# ✅ Asks for Firebase credentials  
# ✅ Asks for branding (optional logo)
# ✅ Updates all config files
# ✅ Creates .template-configured marker

# 3. Install dependencies
npm install

# 4. Test locally
npm run tauri dev

# 5. Build production
npm run tauri build
```

### Reconfiguration
```bash
# Reset and reconfigure
npm run setup-template:reset

# Or manually edit files
vim src/config/appConfig.ts
vim .env
npm run tauri build
```

---

## 📊 Configuration Files Generated

### appConfig.ts (Auto-Generated)
```typescript
export const APP_CONFIG = {
  name: "HRM System",
  companyName: "New Lanka Clothing (Pvt) Ltd",
  version: "1.0.0",
  developerName: "Asitha Kanchana",
  linkedinUrl: "https://linkedin.com/in/asithakanchana",
};
```

### .env (Auto-Generated)
```bash
VITE_FB_API_KEY=AIzaSy...
VITE_FB_AUTH_DOMAIN=my-project.firebaseapp.com
# ... other Firebase vars
```

### tauri.conf.json (Partial Update)
```json
{
  "productName": "New Lanka Clothing (Pvt) Ltd - HRM",
  "identifier": "com.newlankaclothing.hrm",
  "version": "1.0.0"
}
```

### .template-configured (Marker File)
```
Configured on 2026-03-07T12:00:00.000Z
Prevents re-prompting on subsequent runs
```

---

## 🔐 Security Features

### Input Validation

```typescript
// Validate all inputs
const validators = {
  companyName: (v) => v.length >= 3 && v.length <= 100,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  firebaseApiKey: (v) => v.startsWith('AIzaSy'),
  firebaseProjectId: (v) => /^[a-z0-9-]{6,}$/.test(v),
  firebaseSenderId: (v) => /^\d{12,}$/.test(v),
};
```

### Secure Storage

```typescript
// Store sensitive data safely
// .env - in .gitignore (never committed)
// .template-configured - marks setup completion
// All other data in appConfig.ts - safe to commit
```

### Credentials Masking

```typescript
// In wizard output
Firebase API Key: AIzaSy••••••••••••••••••••••••••••••••••
// (Show first 6, hide rest with dots)
```

---

## 📱 Onboarding Features

### First-Run Experience

```typescript
// src/components/SetupWizard.tsx (In-App Setup)
// Option to complete setup within app if needed
// Useful for users who want to change config later

export const SetupWizard = () => {
  const [step, setStep] = useState(0);
  
  return (
    <div className="setup-wizard">
      {step === 0 && <CompanyInfoStep />}
      {step === 1 && <FirebaseConfigStep />}
      {step === 2 && <ReviewStep />}
    </div>
  );
};
```

### Skip/Customize Later

```typescript
// Allow users to:
// 1. Use defaults (demo mode)
// 2. Skip setup (manual config later)
// 3. Quick setup (5 minutes)
// 4. Advanced setup (manual file editing)
```

---

## 📋 Implementation Checklist

### Phase 1: Setup Script (Week 1)
- [ ] Create scripts/setup-wizard.ts
- [ ] Add inquirer dependency
- [ ] Implement config updating functions
- [ ] Test with sample inputs

### Phase 2: Add to Build (Week 1)
- [ ] Add npm run setup-template script
- [ ] Add to package.json
- [ ] Update README with setup instructions
- [ ] Create SETUP_GUIDE.md

### Phase 3: Testing (Week 2)
- [ ] Test on Windows
- [ ] Test on macOS
- [ ] Test on Linux
- [ ] Test reconfiguration
- [ ] Test with special characters in company name

### Phase 4: Documentation (Week 2)
- [ ] Update README.md
- [ ] Create video tutorial (optional)
- [ ] Create troubleshooting guide
- [ ] Update PROJECT_DOCS.md

---

## 🎯 Success Metrics

```
Goal: New template users can setup in < 5 minutes

Measurement:
✅ Setup wizard completion: < 300 seconds
✅ User satisfaction: > 4.5/5 stars
✅ Support requests: < 5% of users
✅ Config errors: < 2% of setups

Current manual process: 30 minutes
Target with wizard: 5 minutes
Improvement: 6x faster
```

---

## 🚀 Rollout Timeline

### v2.1.0 (April 2026)
```
✅ Setup wizard implementation
✅ Config file auto-updates
✅ Input validation
✅ Testing on all platforms
```

### v2.2.0 (May 2026)
```
✅ In-app setup wizard (during runtime)
✅ Configuration panel in app
✅ Reset/reconfigure button
```

### v2.3.0 (June 2026)
```
✅ Multi-language setup wizard
✅ Video tutorial integration
✅ Cloud-based config sync
```

---

## 📞 FAQ

**Q: Do I have to use the setup wizard?**
A: No, you can manually edit files. Wizard just makes it faster.

**Q: Can I change config after setup?**
A: Yes! Edit src/config/appConfig.ts and .env anytime.

**Q: Is my Firebase API key safe?**
A: Yes, it's in .env (in .gitignore). Never committed to git.

**Q: What if I mess up Firebase config?**
A: Edit .env and correct values. No harm done.

**Q: Can I import settings from another instance?**
A: Not yet. Plan for v2.3.0 (cloud sync).

---

## 📚 Related Documentation

- [TEMPLATE_SETUP_GUIDE.md](./TEMPLATE_SETUP_GUIDE.md) - Manual setup
- [FIREBASE_STRATEGY.md](./FIREBASE_STRATEGY.md) - Firebase config
- [README.md](./README.md) - Getting started

---

**Last Updated:** March 7, 2026  
**Version:** 2.0.0 (Planning)  
**Scope:** v2.1.0 Implementation
