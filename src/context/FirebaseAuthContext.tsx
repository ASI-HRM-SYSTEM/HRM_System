/**
 * Firebase Auth Context
 * Manages Google Sign-In state and email allowlist verification.
 * Wraps the entire app — local HRM login only appears after Firebase auth passes.
 *
 * ── Auth strategy ──────────────────────────────────────────────────────────────
 * Tauri desktop app:
 *   1. Rust starts a local TCP server (start_google_auth command)
 *   2. System browser opens http://localhost:PORT/auth
 *   3. Browser page immediately redirects to Google sign-in (signInWithRedirect)
 *   4. User signs in with Google account
 *   5. Google redirects back to http://localhost:PORT/auth
 *   6. Page extracts token and redirects to /callback?idToken=...
 *   7. Rust captures token and emits "oauth-callback" event
 *   8. Frontend signs in via signInWithCredential with that token ✅
 *
 * Regular browser:
 *   signInWithPopup (standard, reliable in proper browser context)
 */

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithCredential,
    getRedirectResult,
    signOut as fbSignOut,
    onAuthStateChanged,
    type User,
} from "firebase/auth";
import { invoke } from "@tauri-apps/api/core";
import { open as shellOpen } from "@tauri-apps/plugin-shell";
import { listen } from "@tauri-apps/api/event";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, COMPANY_ID, firebaseConfig, isFirebaseConfigured } from "../config/firebase";

// ─── TEMPORARY BYPASS ─────────────────────────────────────────────────────────
// Set to `true` to skip the Google Sign-In gate entirely.
// Firebase & Firestore sync remain active — only the auth wall is removed.
// When switching back to the google-auth branch, set this to `false` or remove it.
const BYPASS_GOOGLE_AUTH = false;

// ─── Tauri detection ──────────────────────────────────────────────────────────
// Tauri 2 always injects `window.__TAURI_INTERNALS__` into the WebView.
// `window.__TAURI__` requires `withGlobalTauri: true` in tauri.conf.json.
const isTauri = (): boolean =>
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

// ─── Types ────────────────────────────────────────────────────────────────────
type FirebaseAuthStatus =
    | "loading"         // checking auth / redirect state on startup
    | "unconfigured"    // no .env — skip Firebase gate
    | "unauthenticated" // not signed in
    | "redirecting"     // opening system browser for OAuth
    | "checking"        // signed in, verifying allowlist
    | "allowed"         // signed in + allowlisted ✅
    | "denied";         // signed in but NOT allowlisted ❌

interface FirebaseAuthContextValue {
    status: FirebaseAuthStatus;
    firebaseUser: User | null;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    error: string | null;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<FirebaseAuthStatus>(
        BYPASS_GOOGLE_AUTH ? "unconfigured" : (isFirebaseConfigured() ? "loading" : "unconfigured")
    );
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const redirectCheckDone = useRef(false);

    // ── Allowlist check ───────────────────────────────────────────────────────
    const checkAllowlist = async (user: User): Promise<boolean> => {
        const userEmail = user.email ?? "";
        console.log("[FirebaseAuth] Checking allowlist for email:", userEmail);
        try {
            const accessRef = doc(db, "companies", COMPANY_ID, "settings", "access");
            const snap = await getDoc(accessRef);
            if (!snap.exists()) {
                console.info("[FirebaseAuth] ⚠️ No access document found — allowing all users (dev mode)");
                return true;
            }
            const allowedEmails: string[] = snap.data().allowed_emails || [];
            console.log("[FirebaseAuth] Allowed emails:", allowedEmails);
            const isAllowed = allowedEmails.includes(userEmail);
            console.log(`[FirebaseAuth] ${isAllowed ? "✅" : "❌"} ${userEmail} ${isAllowed ? "found" : "NOT found"} in allowlist`);
            return isAllowed;
        } catch (err: any) {
            console.error("[FirebaseAuth] Allowlist check error:", err.message || err);
            return true; // fail open so a Firestore config issue doesn't lock everyone out
        }
    };

    // ── Handle a successfully authenticated user ───────────────────────────────
    const handleSignedInUser = async (user: User) => {
        setFirebaseUser(user);
        setStatus("checking");
        const allowed = await checkAllowlist(user);
        setStatus(allowed ? "allowed" : "denied");
        if (!allowed) {
            setError(`${user.email} is not authorized. Contact your administrator.`);
        } else {
            setError(null);
        }
    };

    // ── Effect: startup auth check ────────────────────────────────────────────
    useEffect(() => {
        if (BYPASS_GOOGLE_AUTH) return; // Auth gate bypassed — skip listener setup
        if (!isFirebaseConfigured()) return;

        console.log("[FirebaseAuth] Setting up authentication... (Tauri:", isTauri(), ")");

        // For browser: check if there's a pending redirect result from a previous
        // signInWithRedirect call (not used for Tauri, but kept for browser path).
        const checkRedirect = async () => {
            if (isTauri()) return; // Tauri doesn't use redirect flow
            try {
                const result = await getRedirectResult(auth);
                if (result?.user) {
                    console.log("[FirebaseAuth] ✅ Redirect result found for:", result.user.email);
                    await handleSignedInUser(result.user);
                }
            } catch (err: any) {
                console.error("[FirebaseAuth] Redirect result error:", err.code, err.message);
            }
        };

        checkRedirect().finally(() => { redirectCheckDone.current = true; });

        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            console.log("[FirebaseAuth] Auth state changed. User:", user?.email || "none");
            if (!user) {
                if (redirectCheckDone.current) {
                    setFirebaseUser(null);
                    setStatus("unauthenticated");
                } else {
                    setTimeout(() => {
                        setStatus(s => s === "loading" || s === "checking" ? "unauthenticated" : s);
                    }, 1000);
                }
                setError(null);
                return;
            }
            // Persisted session — run allowlist check.
            await handleSignedInUser(user);
        });

        return () => {
            console.log("[FirebaseAuth] Cleaning up auth listener");
            unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Tauri OAuth via external browser + local server ───────────────────────
    const signInWithGoogleTauri = async () => {
        console.log("[FirebaseAuth] Tauri path: starting local OAuth server...");
        setError(null);
        setStatus("redirecting");

        try {
            // 1. Start local TCP server and inject Firebase config into served auth page.
            const firebaseConfigJson = JSON.stringify(firebaseConfig);
            const port = await invoke<number>("start_google_auth", {
                firebaseConfig: firebaseConfigJson,
            });
            console.log("[FirebaseAuth] Local OAuth server listening on port:", port);

            // 2. Open the local auth page in system browser (NOT Tauri WebView).
            const authUrl = `http://localhost:${port}/auth`;
            console.log("[FirebaseAuth] Opening system browser for:", authUrl);
            await shellOpen(authUrl);

            // 3. Wait for Rust server to emit the Google ID token.
            const idToken = await new Promise<string>((resolve, reject) => {
                const timeout = setTimeout(
                    () => reject(new Error("Sign-in timed out. Please try again.")),
                    5 * 60 * 1000
                );

                // Listen for success
                const unlistenSuccess = listen<string>("oauth-callback", event => {
                    clearTimeout(timeout);
                    unlistenSuccess.then(fn => fn());
                    unlistenError.then(fn => fn());
                    resolve(event.payload);
                });

                // Listen for error
                const unlistenError = listen<string>("oauth-callback-error", event => {
                    clearTimeout(timeout);
                    unlistenSuccess.then(fn => fn());
                    unlistenError.then(fn => fn());
                    reject(new Error(event.payload));
                });
            });

            console.log("[FirebaseAuth] Received Google token from local callback.");

            // 4. Sign in to Firebase with the Google ID token.
            console.log("[FirebaseAuth] Signing in with Google credential...");
            const credential = GoogleAuthProvider.credential(idToken);
            const result = await signInWithCredential(auth, credential);
            console.log("[FirebaseAuth] ✅ Signed in as:", result.user.email);

            // 5. Check allowlist and update status.
            await handleSignedInUser(result.user);

        } catch (err: any) {
            console.error("[FirebaseAuth] Tauri OAuth error:", err.message);
            setStatus("unauthenticated");
            setError(`Sign-in failed: ${err.message || "Unknown error"}`);
        }
    };

    // ── Browser OAuth via popup ────────────────────────────────────────────────
    const signInWithGoogleBrowser = async () => {
        console.log("[FirebaseAuth] Browser path: using signInWithPopup...");
        setError(null);
        setStatus("loading");
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: "select_account" });
            const result = await signInWithPopup(auth, provider);
            console.log("[FirebaseAuth] ✅ Popup sign-in successful for:", result.user.email);
            await handleSignedInUser(result.user);
        } catch (err: any) {
            if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
                setStatus("unauthenticated");
                return;
            }
            setStatus("unauthenticated");
            const messages: Record<string, string> = {
                "auth/popup-blocked": "Popup blocked. Please allow popups for this site.",
                "auth/network-request-failed": "Network error. Check your connection.",
                "auth/internal-error": "Internal error. Please try again.",
            };
            setError(`Sign-in failed: ${messages[err.code] || err.message}`);
        }
    };

    const signInWithGoogle = isTauri() ? signInWithGoogleTauri : signInWithGoogleBrowser;

    const signOut = async () => {
        await fbSignOut(auth);
        setFirebaseUser(null);
        setStatus("unauthenticated");
        setError(null);
    };

    return (
        <FirebaseAuthContext.Provider value={{ status, firebaseUser, signInWithGoogle, signOut, error }}>
            {children}
        </FirebaseAuthContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useFirebaseAuth(): FirebaseAuthContextValue {
    const ctx = useContext(FirebaseAuthContext);
    if (!ctx) throw new Error("useFirebaseAuth must be used inside FirebaseAuthProvider");
    return ctx;
}
