# Bug Reports and Fixes

Last updated: 2026-03-03

This document tracks defects found during the Firebase + Tauri authentication implementation.

## BR-001 — White screen on startup

- Severity: Critical
- Symptom: App renders blank white screen immediately.
- Root cause: Invalid token at top of `src/context/FirebaseAuthContext.tsx` (`make` before comment), causing frontend parse/runtime failure.
- Fix applied:
  - Removed stray token so file starts with valid comment and imports.
- Status: Fixed

## BR-002 — Rust warning: unreachable code

- Severity: Medium
- Symptom: `cargo check` warns about unreachable statement in `start_google_auth` loop.
- Root cause: All branches in `match listener.accept()` diverged, but code attempted to use a variable after match.
- Fix applied:
  - Refactored listener loop to non-blocking accept + explicit timeout loop.
  - Removed unreachable statement.
- Status: Fixed

## BR-003 — Rust warning: unused variable `remaining`

- Severity: Low
- Symptom: compile warning for unused variable in `start_google_auth`.
- Root cause: timeout duration variable computed but not used meaningfully.
- Fix applied:
  - Simplified timeout handling using deadline check per loop iteration.
- Status: Fixed

## BR-004 — OAuth callback hostname mismatch risk

- Severity: High
- Symptom: potential redirect/auth rejection or loop when callback domain differs.
- Root cause: inconsistent use of `127.0.0.1` vs `localhost` in parts of flow.
- Fix applied:
  - Standardized callback construction and listener usage on `localhost`.
- Status: Fixed

## BR-005 — OAuth callback capture reliability

- Severity: Medium
- Symptom: callback listener can capture irrelevant requests (e.g. `/favicon.ico`) if not filtered.
- Root cause: local listener accepted first request without strict callback validation.
- Fix applied:
  - Ignore non-callback requests and continue listening until valid query callback is received.
- Status: Fixed

## BR-006 — Google OAuth `redirect_uri_mismatch`

- Severity: Critical
- Symptom: Google screen shows `Error 400: redirect_uri_mismatch` after account selection.
- Root cause: Callback URI mismatch between runtime URI and OAuth client configuration.
- Fix applied:
  - Backend callback moved from random port to fixed `http://localhost:43189`.
  - Frontend now uses returned fixed port URI consistently.
- Required environment/config action:
  - Add/confirm `http://localhost:43189` in OAuth redirect URIs for the Firebase-linked Google OAuth client.
- Status: Partially fixed (code done, console config required)

## Open Follow-up Items

- Validate complete end-to-end sign-in in desktop runtime after rebuild.
- Capture final runtime logs for one successful and one denied-email attempt.
- Add regression checklist to release process.

## Related Documents

- [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [Main Project Docs](../PROJECT_DOCS.md)
