/**
 * Firebase App Initialization
 * Reads config from centralized ENV module (src/config/env.ts)
 * Environment variables are injected at build time from the .env file (never committed to git)
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { ENV } from "./env";

export const firebaseConfig = {
    apiKey: ENV.firebase.apiKey,
    authDomain: ENV.firebase.authDomain,
    projectId: ENV.firebase.projectId,
    storageBucket: ENV.firebase.storageBucket,
    messagingSenderId: ENV.firebase.messagingSenderId,
    appId: ENV.firebase.appId,
};

// Company ID used as Firestore root path
export const COMPANY_ID: string = ENV.firebase.companyId;

// Firebase API key — also used by the local-server OAuth REST calls for Tauri
export const FIREBASE_API_KEY: string = ENV.firebase.apiKey;

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
