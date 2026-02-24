/**
 * Firebase Auth Context
 * Manages Google Sign-In state and email allowlist verification.
 * Wraps the entire app — local HRM login only appears after Firebase auth passes.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
    GoogleAuthProvider, signInWithPopup, signOut as fbSignOut,
    onAuthStateChanged, type User,
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

        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            setFirebaseUser(user);
            if (!user) {
                setStatus("unauthenticated");
                return;
            }
            setStatus("checking");
            const allowed = await checkAllowlist(user);
            setStatus(allowed ? "allowed" : "denied");
            if (!allowed) setError(`${user.email} is not authorized. Contact your administrator.`);
        });
        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            // onAuthStateChanged above handles status update
        } catch (err: any) {
            if (err.code !== "auth/popup-closed-by-user") {
                setError(`Sign-in failed: ${err.message}`);
            }
        }
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
