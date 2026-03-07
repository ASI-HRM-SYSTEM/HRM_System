# Google Authentication Fix Documentation

## Problem Summary

The HRM system experienced issues with Google authentication in the Tauri desktop application. The authentication flow failed in two distinct ways:

### Issue 1: Popup Blocker (Initial Implementation)
**Symptom:** `auth/popup-blocked` error when trying to sign in  
**Root Cause:** Auto-triggered `signInWithPopup` on page load violated browser popup policies  
**Why it happened:** Browsers block popups that are not triggered by direct user interaction

### Issue 2: Redirect Loop (Second Implementation) 
**Symptom:** After selecting Google account, user got stuck in infinite loop showing account selector repeatedly  
**Root Cause:** `signInWithRedirect` redirected to Firebase domain (newlanka-hrm.firebaseapp.com) instead of localhost  
**Why it happened:** Firebase's redirect flow is designed for hosted web apps, not localhost-based desktop apps  
**Console errors:**
```
net::ERR_BLOCKED_BY_CLIENT (ad blocker blocking Google Play analytics - not critical)
Repeated account chooser calls without completing authentication
```

### Issue 3: Invalid Credential Error (Third Implementation)
**Symptom:** After successful Google sign-in in browser, app shows:  
```
Firebase: Invalid id_token in IdP response: [JWT token]
error: id token is not issued by Google. (auth/invalid-credential)
```
**Root Cause:** Extracted Firefox ID token (`result.user.getIdToken()`) instead of Google OAuth ID token  
**Why it happened:** Two different token types exist after successful sign-in:
- **Google OAuth ID token**: Issued by `https://accounts.google.com` - needed for `GoogleAuthProvider.credential()`
- **Firebase ID token**: Issued by `https://securetoken.google.com/newlanka-hrm` - for Firebase services

**JWT Analysis:** The token we were sending had issuer `"iss": "https://securetoken.google.com/newlanka-hrm"` proving it was a Firebase token, not a Google token.

## Solution: Button-Triggered Popup in External Browser

### Why This Approach Works

1. **External Browser Context:** The auth page opens in the system browser (not Tauri WebView), which has different popup policies
2. **User-Initiated Action:** The popup is triggered by clicking a button, satisfying browser security requirements
3. **Localhost Flow:** Stays entirely on localhost, avoiding Firebase domain redirects
4. **Simple UX:** Single button click - perfect for non-technical factory staff

### Technical Implementation

#### Architecture Flow
```
User clicks "Sign in with Google" in HRM app
    ↓
Tauri command starts local TCP server on port 43189
    ↓
System browser opens http://localhost:43189/auth
    ↓
User sees styled "Continue with Google" button
    ↓
User clicks button → signInWithPopup opens Google auth popup
    ↓
User signs in with Google account (in popup window)
    ↓
Popup closes, main page receives ID token
    ↓
Page redirects to http://localhost:43189/callback?idToken=...
    ↓
Rust server captures token and emits "oauth-callback" event
    ↓
Tauri frontend receives token and completes sign-in
    ↓
User is authenticated ✅
```

#### Key Code Changes

**1. Auth Page HTML (src-tauri/src/auth_commands.rs)**
```javascript
// CORRECT: Extract Google OAuth credential
window.doSignIn = async function() {
  const btn = document.getElementById('signInBtn');
  btn.disabled = true;
  
  try {
    const result = await signInWithPopup(auth, provider);
    
        // Extract Google OAuth credential (NOT Firebase token)
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const idToken = credential.idToken; // Google OAuth ID token ✅
    
        if (!idToken) {
            throw new Error('Failed to get Google OAuth token');
        }
    
    window.location.href = '/callback?idToken=' + encodeURIComponent(idToken);
  } catch (err) {
    // Error handling
  }
};

// WRONG: Gets Firebase token instead of Google token ❌
// const idToken = await result.user.getIdToken();
// This returns a Firebase ID token, not the Google OAuth token!

// ALSO WRONG: Auto-triggered redirect (CAUSED LOOP) ❌
// window.onload = async function() {
//   await signInWithRedirect(auth, provider);
//   const result = await getRedirectResult(auth);
//   // ... this redirected to Firebase domain
// };
```

**2. UI Components**
- Added styled "Continue with Google" button with Google logo SVG
- Gradient background (#667eea → #764ba2)
- Loading spinner during sign-in
- Clear error messages for different failure scenarios
- Disabled button state to prevent double-clicks

**3. Updated Documentation**
- FirebaseAuthContext.tsx: Updated auth flow comments
- auth_commands.rs: Updated function documentation

## Testing Instructions

### Prerequisites
- HRM system installed (`npm install` and `cargo build`)
- Firebase configuration properly set in `.env`
- Test Google account added to Firebase whitelist

### Test Procedure
1. Run development build: `npm run tauri dev`
2. Click "Sign in with Google" button in HRM app
3. External browser opens with styled auth page
4. Click "Continue with Google" button
5. Google authentication popup appears
6. Select your Google account
7. Complete any required verification
8. Popup closes automatically
9. HRM app shows you as signed in

### Expected Behavior
- ✅ Auth page loads in external browser
- ✅ Button is visible and styled correctly
- ✅ Clicking button opens Google auth popup (no blocked popup errors)
- ✅ Account selector appears once (no infinite loop)
- ✅ After selecting account, popup closes
- ✅ Token is captured by Rust server
- ✅ User is signed in to HRM app
- ✅ Browser tab can be closed manually

### Common Issues

**Issue: Popup is blocked**
- **Cause:** Browser's popup blocker settings
- **Solution:** Allow popups for localhost in browser settings

**Issue: "Firebase configuration failed"**
- **Cause:** Invalid or missing Firebase config
- **Solution:** Check `.env` file has correct Firebase credentials

**Issue: "This app is not authorized"**
- **Cause:** Google account not whitelisted in Firebase
- **Solution:** Add user's email to Firebase Authentication → Sign-in method → Google → Authorized domains

## Comparison of Approaches

| Approach | Popup Blocker | Redirect Loop | User Experience | Result |
|----------|--------------|---------------|-----------------|---------|
| Auto signInWithPopup | ❌ Blocked | N/A | Confusing errors | Failed |
| Auto signInWithRedirect | ✅ No popup | ❌ Infinite loop | Stuck at account selector | Failed |
| Button signInWithPopup (Firebase token) | ✅ User-triggered | ✅ Stays on localhost | Invalid credential error | Failed |
| Button signInWithPopup (Google OAuth token) | ✅ User-triggered | ✅ Stays on localhost | Single button click | **Success** ✅ |

## Browser Compatibility

Tested and working on:
- ✅ Chrome/Chromium (primary target)
- ✅ Firefox
- ✅ Edge

**Note:** Safari on macOS may have stricter popup policies. If issues occur, ensure "Block pop-up windows" is disabled for localhost.

## Security Considerations

1. **Local Server Port:** Uses random available port (typically 43189) to avoid conflicts
2. **Token Transmission:** ID token transmitted via localhost URL (secure in desktop context)
3. **Token Lifetime:** ID token is short-lived and used immediately
4. **No Credentials Exposed:** Firebase config is public info, no secrets exposed
5. **Browser Isolation:** External browser prevents token access from main app until callback

## Future Improvements

- [ ] Add automatic browser detection and opening
- [ ] Implement fallback to email/password if Google auth fails repeatedly
- [ ] Add session persistence to reduce re-authentication frequency
- [ ] Consider implementing refresh token flow for longer sessions
- [ ] Add telemetry to track auth success rates

## Related Documentation

- [MFA Implementation Plan](./MFA_IMPLEMENTATION.md) - Planned for v1.4.0
- [Firebase Config](../src/config/firebase.ts) - Firebase initialization
- [Auth Context](../src/context/FirebaseAuthContext.tsx) - Authentication state management
- [Auth Commands](../src-tauri/src/auth_commands.rs) - Rust backend implementation

## Version History

- **v1.2.x:** Auto-triggered signInWithPopup (popup blocker issues) ❌
- **v1.3.0:** Auto-triggered signInWithRedirect (redirect loop issues) ❌
- **v1.4.0-dev:** Button-triggered signInWithPopup (initially Firebase token - invalid credential) ❌
- **v1.4.0-dev (current):** Button-triggered signInWithPopup with correct Google OAuth token ✅

## Contact

For issues or questions about Google authentication:
1. Check this documentation first
2. Review browser console for specific error messages
3. Verify Firebase configuration in `.env`
4. Ensure test account is whitelisted in Firebase Console

---

**Last Updated:** March 7, 2026  
**Status:** ✅ Working solution implemented  
**Target Users:** Non-technical factory staff (simple, one-click experience)
