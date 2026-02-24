/**
 * Firebase App Initialization
 * Reads config from Vite environment variables (VITE_FB_*)
 * These are injected at build time from the .env file (never committed to git)
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FB_API_KEY,
    authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FB_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FB_APP_ID,
};

// Company ID used as Firestore root path
export const COMPANY_ID: string = import.meta.env.VITE_FB_COMPANY_ID || "newlanka";

// Check whether Firebase is configured
export const isFirebaseConfigured = (): boolean =>
    Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Singleton initialization
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (isFirebaseConfigured()) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
}

export { app, db, auth };
