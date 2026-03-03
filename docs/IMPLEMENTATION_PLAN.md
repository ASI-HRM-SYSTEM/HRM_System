# Firebase + Tauri Authentication Implementation Plan

Last updated: 2026-03-03

## Objective

Provide a reliable Google authentication experience for the desktop app by avoiding popup/redirect limitations in embedded WebViews, while preserving normal popup login for regular browser usage.

## Scope

- In scope:
  - Tauri-safe Google OAuth flow
  - Firebase session establishment from OAuth callback
  - Allowlist validation against Firestore
  - Error handling and status visibility
  - Developer documentation and bug tracking
- Out of scope:
  - Replacing Firebase with a different identity provider
  - UI redesign beyond existing auth states

## Final Architecture

### Browser path

- Use `signInWithPopup` from Firebase SDK.
- Continue existing allowlist check in Firestore.

### Tauri desktop path

1. Frontend invokes Rust command `start_google_auth`.
2. Rust binds temporary local listener on `localhost:0` (random free port).
3. Frontend requests Firebase `accounts:createAuthUri` with `continueUri=http://localhost:<port>`.
4. System browser opens returned OAuth URL.
5. Google redirects back to local listener with query params.
6. Rust emits `oauth-callback` event with callback URL.
7. Frontend calls Firebase `accounts:signInWithIdp`.
8. Frontend creates Firebase credential and signs in with `signInWithCredential`.
9. Existing allowlist check runs and gates access.

## Files Involved

- Frontend auth orchestration:
  - `src/context/FirebaseAuthContext.tsx`
- Firebase configuration export updates:
  - `src/config/firebase.ts`
- Rust OAuth callback listener command:
  - `src-tauri/src/auth_commands.rs`
- Tauri command registration:
  - `src-tauri/src/main.rs`

## Status Model

The auth context uses explicit status values:

- `loading`
- `unconfigured`
- `unauthenticated`
- `redirecting`
- `checking`
- `allowed`
- `denied`

These states avoid ambiguous rendering and make failures diagnosable.

## Verification Checklist

- [ ] App starts without white screen.
- [ ] Clicking Google sign-in in Tauri opens system browser.
- [ ] OAuth callback returns to local listener and closes with success page.
- [ ] Firebase session is created in app.
- [ ] Allowlisted emails reach app login screen.
- [ ] Non-allowlisted emails are denied with clear error.
- [ ] Browser path still works via popup.

## Required OAuth Configuration

- Local callback URI used by desktop flow: `http://localhost:43189`
- Ensure this URI is allowed in the OAuth client used by Firebase Google provider.
- Keep `localhost` in Firebase Authentication authorized domains.

## Risks and Mitigations

- Local callback never arrives
  - Mitigation: backend timeout and user-facing timeout error.
- Redirect loop due domain mismatch
  - Mitigation: enforce `localhost` consistently in callback flow.
- Runtime rendering failures
  - Mitigation: strict compile checks and keep auth context syntax-clean.

## Related Documents

- [Bug Reports and Fixes](./BUG_REPORTS.md)
- [Main Project Docs](../PROJECT_DOCS.md)
