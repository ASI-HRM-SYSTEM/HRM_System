/**
 * Firebase Auth Context
 * Manages Google Sign-In state and email allowlist verification.
 * Wraps the entire app — local HRM login only appears after Firebase auth passes.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
    GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
    signOut as fbSignOut, onAuthStateChanged, type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, COMPANY_ID, isFirebaseConfigured } from "../config/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────
type FirebaseAuthStatus =
    | "loading"        // checking auth state
    | "unconfigured"   // no .env — skip Firebase gate
    | "unauthenticated"// not signed in
    | "checking"       // signed in, verifying allowlist
    | "allowed"        // signed in + allowlisted ✅
    | "denied";        // signed in but NOT allowlisted ❌

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
        isFirebaseConfigured() ? "loading" : "unconfigured"
    );
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Check if a signed-in email is in the Firestore allowlist
    const checkAllowlist = async (user: User): Promise<boolean> => {
        try {
            const accessRef = doc(db, "companies", COMPANY_ID, "settings", "access");
            const snap = await getDoc(accessRef);
            if (!snap.exists()) {
                console.warn("[FirebaseAuth] No access document found in Firestore.");
                return false;
            }
            const allowedEmails: string[] = snap.data().allowed_emails || [];
            return allowedEmails.includes(user.email ?? "");
        } catch (err) {
            console.error("[FirebaseAuth] Allowlist check failed:", err);
            return false;
        }
    };

    useEffect(() => {
        if (!isFirebaseConfigured()) return;

        // Check redirect result first (happens after OAuth redirect)
        (async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result?.user) {
                    console.log("[FirebaseAuth] Processing redirect result for:", result.user.email);
                    const allowed = await checkAllowlist(result.user);
                    setStatus(allowed ? "allowed" : "denied");
                    if (!allowed) {
                        setError(`${result.user.email} is not authorized. Contact your administrator.`);
                    }
                }
            } catch (err: any) {
                console.error("[FirebaseAuth] Redirect result error:", err);
            }
        })();

        // Set up listener for auth state changes (handles both popup and redirect)
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            setFirebaseUser(user);
            if (!user) {
                setStatus("unauthenticated");
                setError(null);
                return;
            }
            setStatus("checking");
            const allowed = await checkAllowlist(user);
            setStatus(allowed ? "allowed" : "denied");
            if (!allowed) {
                setError(`${user.email} is not authorized. Contact your administrator.`);
            }
        });
        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            
            // Try popup first
            try {
                await signInWithPopup(auth, provider);
                // onAuthStateChanged above handles status update
            } catch (popupErr: any) {
                // If popup is blocked, fall back to redirect-based sign-in
                if (
                    popupErr.code === "auth/popup-blocked" ||
                    popupErr.code === "auth/operation-not-supported-in-this-environment"
                ) {
                    console.log("[FirebaseAuth] Popup blocked - using redirect instead");
                    await signInWithRedirect(auth, provider);
                    // User will be redirected to Google, then back to app with result
                } else if (popupErr.code === "auth/popup-closed-by-user") {
                    // User closed the popup, no error to show
                    return;
                } else {
                    throw popupErr;
                }
            }
        } catch (err: any) {
            const errorMsg = getErrorMessage(err);
            setError(`Sign-in failed: ${errorMsg}`);
        }
    };

    const getErrorMessage = (err: any): string => {
        if (!err.code) return err.message || "Unknown error";
        
        const errorMap: Record<string, string> = {
            "auth/popup-blocked": "Popup blocked. Please allow popups or try again.",
            "auth/popup-closed-by-user": "Sign-in popup was closed",
            "auth/operation-not-supported-in-this-environment": "Sign-in not supported in this context",
            "auth/network-request-failed": "Network error. Please check your connection.",
            "auth/internal-error": "Internal authentication error. Please try again.",
        };
        
        return errorMap[err.code] || err.message || "Unknown error";
    };

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
