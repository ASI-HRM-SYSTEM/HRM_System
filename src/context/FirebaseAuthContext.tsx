/**
 * Firebase Auth Context
 * Manages Google Sign-In state and email allowlist verification.
 * Wraps the entire app — local HRM login only appears after Firebase auth passes.
 *
 * ── Auth strategy ──────────────────────────────────────────────────────────────
 * Tauri desktop app:
 *   1. Rust starts a local TCP server (start_google_auth command)
 *   2. System browser opens http://localhost:PORT/auth
 *   3. User clicks "Continue with Google" button
 *   4. signInWithPopup opens Google auth (works fine in external browser)
 *   5. User signs in with Google account
 *   6. Popup closes, page gets token and redirects to /callback?idToken=...
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
import type { FirebaseAuthStatus } from "../models/AppAccess";

// ─── TEMPORARY BYPASS ─────────────────────────────────────────────────────────
// Set to `true` to skip the Google Sign-In gate entirely.
// Firebase & Firestore sync remain active — only the auth wall is removed.
// When switching back to the google-auth branch, set this to `false` or remove it.
const BYPASS_GOOGLE_AUTH = false;
const FIREBASE_ACCESS_CACHE_KEY = "firebase_access_cache_v1";
const FIREBASE_DEVICE_SETUP_KEY = "firebase_device_setup_v1";

// ─── Tauri detection ──────────────────────────────────────────────────────────
// Tauri 2 always injects `window.__TAURI_INTERNALS__` into the WebView.
// `window.__TAURI__` requires `withGlobalTauri: true` in tauri.conf.json.
const isTauri = (): boolean =>
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

interface FirebaseAuthContextValue {
    status: FirebaseAuthStatus;
    firebaseUser: User | null;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    error: string | null;
    isOffline: boolean;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<FirebaseAuthStatus>(
        BYPASS_GOOGLE_AUTH ? "unconfigured" : (isFirebaseConfigured() ? "loading" : "unconfigured")
    );
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== "undefined" ? !navigator.onLine : false);
    const redirectCheckDone = useRef(false);

    const saveAllowCache = (user: User) => {
        if (!user.email) return;
        localStorage.setItem(FIREBASE_ACCESS_CACHE_KEY, JSON.stringify({
            email: user.email,
            verifiedAt: new Date().toISOString(),
        }));
    };

    const getAllowCache = (): { email: string; verifiedAt: string } | null => {
        try {
            const raw = localStorage.getItem(FIREBASE_ACCESS_CACHE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw) as { email?: string; verifiedAt?: string };
            if (!parsed.email || !parsed.verifiedAt) return null;
            return { email: parsed.email, verifiedAt: parsed.verifiedAt };
        } catch {
            return null;
        }
    };

    const clearAllowCache = () => {
        localStorage.removeItem(FIREBASE_ACCESS_CACHE_KEY);
    };

    const markDeviceSetupComplete = (user: User) => {
        localStorage.setItem(FIREBASE_DEVICE_SETUP_KEY, JSON.stringify({
            email: user.email ?? "",
            setupCompletedAt: new Date().toISOString(),
        }));
    };

    const isDeviceSetupComplete = (): boolean => {
        try {
            const raw = localStorage.getItem(FIREBASE_DEVICE_SETUP_KEY);
            if (!raw) return false;
            const parsed = JSON.parse(raw) as { setupCompletedAt?: string };
            return Boolean(parsed.setupCompletedAt);
        } catch {
            return false;
        }
    };

    const clearDeviceSetup = () => {
        localStorage.removeItem(FIREBASE_DEVICE_SETUP_KEY);
    };

    const allowOfflineFromCache = (fallbackEmail?: string | null): boolean => {
        if (!isDeviceSetupComplete()) return false;
        const cached = getAllowCache();
        if (!cached) return false;
        const email = fallbackEmail ?? cached.email;
        setError(`Offline mode active. This device already completed first-time online setup${email ? ` for ${email}` : ""}. Firebase sync will resume when internet returns.`);
        setStatus("allowed-offline");
        return true;
    };

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    useEffect(() => {
        if (isOffline) return;
        if (status !== "allowed-offline") return;

        const currentUser = auth.currentUser;
        if (currentUser) {
            handleSignedInUser(currentUser).catch((err) => {
                console.error("[FirebaseAuth] Online revalidation failed:", err);
            });
            return;
        }

        setError("Internet connection restored. Cloud sync is available again.");
    }, [isOffline, status]);

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
            if (!navigator.onLine) {
                return allowOfflineFromCache(user.email);
            }
            return true; // fail open so a Firestore config issue doesn't lock everyone out
        }
    };

    // ── Handle a successfully authenticated user ───────────────────────────────
    const handleSignedInUser = async (user: User) => {
        setFirebaseUser(user);

        if (!navigator.onLine) {
            if (allowOfflineFromCache(user.email)) {
                return;
            }
            setStatus("unauthenticated");
            setError("Internet connection is required for first-time setup on this device. Complete verification online once, then offline mode will be available.");
            return;
        }

        setStatus("checking");
        const allowed = await checkAllowlist(user);
        setStatus(allowed ? "allowed" : "denied");
        if (!allowed) {
            clearAllowCache();
            clearDeviceSetup();
            setError(`${user.email} is not authorized. Contact your administrator.`);
        } else {
            saveAllowCache(user);
            markDeviceSetupComplete(user);
            setError(null);
        }
    };

    // ── Effect: startup auth check ────────────────────────────────────────────
    useEffect(() => {
        if (BYPASS_GOOGLE_AUTH) return; // Auth gate bypassed — skip listener setup
        if (!isFirebaseConfigured()) return;

        console.log("[FirebaseAuth] Setting up authentication... (Tauri:", isTauri(), ")");

        if (!navigator.onLine) {
            const cached = getAllowCache();
            if (cached) {
                setFirebaseUser(null);
                setStatus("allowed-offline");
                setError(`Offline mode active. First-time setup was already completed for ${cached.email}. Firebase sync will resume when internet returns.`);
            } else {
                setStatus("unauthenticated");
                setError("No internet connection. Connect once to complete first-time setup, verification, and sync preparation.");
            }
        }

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
                if (!navigator.onLine && allowOfflineFromCache()) {
                    setFirebaseUser(null);
                    return;
                }
                if (redirectCheckDone.current) {
                    setFirebaseUser(null);
                    setStatus("unauthenticated");
                } else {
                    setTimeout(() => {
                        setStatus((s: FirebaseAuthStatus) => s === "loading" || s === "checking" ? "unauthenticated" : s);
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

        if (!navigator.onLine) {
            if (allowOfflineFromCache()) return;
            setStatus("unauthenticated");
            setError("Internet connection is required for first-time setup on this device.");
            return;
        }

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
        if (!navigator.onLine) {
            if (allowOfflineFromCache()) return;
            setStatus("unauthenticated");
            setError("Internet connection is required for first-time setup on this device.");
            return;
        }
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
        clearAllowCache();
        clearDeviceSetup();
    };

    return (
        <FirebaseAuthContext.Provider value={{ status, firebaseUser, signInWithGoogle, signOut, error, isOffline }}>
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
