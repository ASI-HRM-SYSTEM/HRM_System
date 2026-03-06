# v1.4.0 - Multifactor Authentication (MFA) Implementation Plan

## Version Context
- **Previous Version (v1.3.0)**: Local verification method for development and testing
- **Current Version (v1.4.0)**: Enhanced security with Multifactor Authentication (MFA)
- **Release Status**: In Development

## Objectives
1. Implement Time-based One-Time Password (TOTP) authentication
2. Add SMS-based OTP as secondary verification method
3. Secure first-time user authentication with mandatory MFA setup
4. Maintain backward compatibility with existing local user authentication

## Architecture

### MFA Methods

#### 1. TOTP (Time-based One-Time Password)
- **Implementation**: TOTP following RFC 6238 standard
- **Libraries**: 
  - Frontend: `qrcode.react`, `speakeasy` or `otplib`
  - Backend: Rust crate `totp-lite` or `oath-rs`
- **Features**:
  - Generate QR codes for authenticator apps (Google Authenticator, Microsoft Authenticator, Authy)
  - Backup codes for account recovery
  - Per-user TOTP secret storage (encrypted in database)

#### 2. SMS-based OTP
- **Provider**: Firebase Phone Auth or Twilio
- **Flow**:
  - User provides phone number during MFA setup
  - System sends 6-digit code via SMS
  - User enters code to verify
  - Phone number is encrypted and stored

### Database Schema Changes

```sql
-- New table for MFA settings
CREATE TABLE mfa_settings (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    totp_secret TEXT, -- encrypted
    totp_enabled BOOLEAN DEFAULT FALSE,
    phone_number TEXT, -- encrypted
    sms_enabled BOOLEAN DEFAULT FALSE,
    backup_codes TEXT, -- encrypted JSON array
    mfa_method_required TEXT, -- 'totp', 'sms', 'both'
    setup_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Track MFA verification attempts
CREATE TABLE mfa_verification_log (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    method TEXT, -- 'totp', 'sms'
    success BOOLEAN,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Frontend Components

1. **MFA Setup Wizard** (`MFASetup.tsx`)
   - TOTP QR code generation and manual entry
   - SMS phone verification
   - Backup codes generation and display
   - Step-by-step configuration

2. **MFA Verification Modal** (`MFAVerification.tsx`)
   - TOTP input field with countdown
   - SMS code input with resend button
   - Backup code option

3. **MFA Settings Page** (`MFASettings.tsx`)
   - Enable/disable MFA methods
   - Change phone number
   - Regenerate backup codes
   - View verification history

### Backend Endpoints (Rust/Tauri)

```
POST /auth/mfa/setup/initiate
  - Returns: QR code data, secret (encrypted)
  
POST /auth/mfa/setup/verify-totp
  - Body: { user_id, totp_code, secret }
  - Validates TOTP code

POST /auth/mfa/setup/verify-phone
  - Body: { user_id, phone_number }
  - Initiates SMS OTP

POST /auth/mfa/verify-code
  - Body: { user_id, code, method }
  - Validates OTP code (TOTP or SMS)

POST /auth/mfa/backup-codes
  - Returns: encrypted backup codes

POST /auth/login/with-mfa
  - Body: { username, password, mfa_code, mfa_method }
  - Complete login flow with MFA
```

### Security Considerations

1. **Secret Storage**
   - All TOTP secrets and phone numbers encrypted with AES-256
   - Encryption key rotated periodically
   - Keys stored in environment variables (not in code)

2. **Rate Limiting**
   - Max 5 failed MFA attempts per user per 15 minutes
   - Temporary account lockout after threshold
   - Log all verification attempts

3. **Backup Codes**
   - 10-12 single-use backup codes generated during setup
   - Each code can only be used once
   - Regeneration available anytime

4. **Session Management**
   - MFA verification required for sensitive operations
   - Re-verification after 30 minutes of inactivity
   - Separate session tokens for after-MFA state

## Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] Database schema updates
- [ ] Backend utility functions for TOTP generation/validation
- [ ] MFA settings table and queries
- [ ] Environment setup for SMS provider

### Phase 2: TOTP Implementation (Week 3-4)
- [ ] TOTP generation and QR code display
- [ ] TOTP verification endpoint
- [ ] Frontend setup wizard
- [ ] Backup codes system

### Phase 3: SMS Implementation (Week 5-6)
- [ ] SMS provider integration (Twilio/Firebase)
- [ ] Phone verification flow
- [ ] SMS OTP endpoint
- [ ] SMS settings UI

### Phase 4: Login Flow Integration (Week 7)
- [ ] Update login endpoint to require MFA
- [ ] Implement MFA verification modal in login
- [ ] First-time MFA setup mandatory flow
- [ ] Session token management with MFA state

### Phase 5: Testing & Polish (Week 8)
- [ ] Unit tests for TOTP/SMS logic
- [ ] Integration tests
- [ ] Security audit
- [ ] Performance optimization

## Dependencies to Add

```json
{
  "totp": "^0.2.0",
  "otplib": "^12.0.1",
  "qrcode": "^1.5.4"
}
```

### Rust Dependencies
```toml
[dependencies]
totp-lite = "2.0"
chrono = "0.4"
base64 = "0.21"
ring = "0.17"
sha2 = "0.10"
```

## First-Time User Flow

1. User creates account → MFA setup form appears immediately
2. User chooses: TOTP, SMS, or both methods
3. If TOTP: Scan QR code → Enter 6 digits to verify
4. If SMS: Enter phone → Receive OTP → Enter code
5. Generate and save backup codes
6. Complete setup → Access HRM system

## Rollback Plan

If issues occur:
1. Keep v1.3.0 available for deployment
2. MFA can be disabled via environment flag during rollout
3. Database remains backward compatible
4. Users without MFA can still authenticate via legacy method

## Success Criteria

- ✅ TOTP implemented and tested
- ✅ SMS OTP working with Twilio/Firebase
- ✅ First-time users must setup MFA
- ✅ Existing users can optionally enable MFA
- ✅ All MFA verification attempts logged
- ✅ No security vulnerabilities in penetration testing
- ✅ Performance impact <100ms on login

## Notes

- Version 1.3.0 serves as stable baseline for local testing
- All MFA features optional initially (can be made mandatory per organization)
- Plan for FIDO2/WebAuthn support in v1.5.0
- Consider push notification approval in v1.6.0
