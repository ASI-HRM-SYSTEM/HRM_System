/**
 * Firebase Auth Context
 * Manages Google Sign-In state and email allowlist verification.
 * Wraps the entire app — local HRM login only appears after Firebase auth passes.
 *
 * ── Auth strategy ──────────────────────────────────────────────────────────────
 * Tauri desktop app:
 *   1. Rust starts a local TCP server on a random port (start_google_auth command)
 *   2. Firebase REST API builds the Google OAuth URL with redirect_uri=127.0.0.1:PORT
 *   3. System browser opens the URL (shell:allow-open)
 *   4. Google authenticates → redirects to local server
 *   5. Rust captures the callback URL, emits "oauth-callback" event
 *   6. Frontend calls Firebase signInWithIdp REST API → gets idToken
 *   7. signInWithCredential(auth, GoogleAuthProvider.credential(idToken)) ✅
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
import { auth, db, COMPANY_ID, FIREBASE_API_KEY, isFirebaseConfigured } from "../config/firebase";

// ─── TEMPORARY BYPASS ─────────────────────────────────────────────────────────
// Set to `true` to skip the Google Sign-In gate entirely.
// Firebase & Firestore sync remain active — only the auth wall is removed.
// When switching back to the google-auth branch, set this to `false` or remove it.
const BYPASS_GOOGLE_AUTH = true;

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
            // 1. Start local TCP server — Rust returns the port it's listening on.
            const port = await invoke<number>("start_google_auth");
            console.log("[FirebaseAuth] Local OAuth server listening on port:", port);

            const redirectUri = `http://localhost:${port}`;
            console.log("[FirebaseAuth] Redirect URI for OAuth:", redirectUri);
            console.log("[FirebaseAuth] Firebase API Key set:", !!FIREBASE_API_KEY);

            // 2. Ask Firebase REST API for the Google OAuth URL.
            console.log("[FirebaseAuth] Calling createAuthUri...");
            const createAuthRes = await fetch(
                `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${FIREBASE_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        providerId: "google.com",
                        continueUri: redirectUri,
                    }),
                }
            );

            if (!createAuthRes.ok) {
                const errData = await createAuthRes.json().catch(() => ({}));
                console.error("[FirebaseAuth] createAuthUri error response:", errData);
                throw new Error(errData?.error?.message || `createAuthUri failed: ${createAuthRes.status}`);
            }

            const authResponse = await createAuthRes.json();
            const { authUri } = authResponse;
            console.log("[FirebaseAuth] Received authUri:", authUri);
            console.log("[FirebaseAuth] Opening system browser for Google auth...");

            // 3. Open Google OAuth URL in the system browser (NOT the Tauri WebView).
            await shellOpen(authUri);

            // 4. Wait for the Rust server to emit the callback URL.
            const oauthCallbackUrl = await new Promise<string>((resolve, reject) => {
                const timeout = setTimeout(
                    () => reject(new Error(`Sign-in timed out. Verify redirect URI is registered: ${redirectUri}`)),
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

            console.log("[FirebaseAuth] Received OAuth callback URL.");

            // 5. Exchange the callback URL for Firebase credentials via REST API.
            const signInRes = await fetch(
                `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        requestUri: oauthCallbackUrl,
                        returnIdpCredential: true,
                        returnSecureToken: true,
                    }),
                }
            );

            if (!signInRes.ok) {
                const errData = await signInRes.json().catch(() => ({}));
                throw new Error(errData?.error?.message || `signInWithIdp failed: ${signInRes.status}`);
            }

            const signInData = await signInRes.json();
            const idToken: string = signInData.oauthIdToken || signInData.idToken;

            if (!idToken) {
                throw new Error("Google did not return an ID token. Please try again.");
            }

            // 6. Sign in to Firebase with the Google ID token.
            console.log("[FirebaseAuth] Signing in with Google credential...");
            const credential = GoogleAuthProvider.credential(idToken);
            const result = await signInWithCredential(auth, credential);
            console.log("[FirebaseAuth] ✅ Signed in as:", result.user.email);

            // 7. Check allowlist and update status.
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
