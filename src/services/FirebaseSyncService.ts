/**
 * Firebase Sync Service
 * Fire-and-forget Firestore sync — always writes to local SQLite first,
 * then syncs to Firestore in the background.
 * If Firebase is not configured or offline, this silently does nothing.
 */

import {
    doc, setDoc, deleteDoc, addDoc, collection, serverTimestamp,
} from "firebase/firestore";
import { db, COMPANY_ID, isFirebaseConfigured } from "../config/firebase";
import type { Employee, DailyCaderReport, TrainingLineDetail } from "../types/employee";

// Helper to get Firestore path for this company
const companyRef = () => `companies/${COMPANY_ID}`;

/**
 * Sync an employee to Firestore (create or update)
 */
export async function syncEmployee(employee: Employee): Promise<void> {
    if (!isFirebaseConfigured()) return;
    try {
        const ref = doc(db, companyRef(), "employees", employee.epf_number);
        await setDoc(ref, {
            ...employee,
            _synced_at: serverTimestamp(),
        });
    } catch (err) {
        console.warn("[FirebaseSync] syncEmployee failed (offline?):", err);
    }
}

/**
 * Delete an employee from Firestore
 */
export async function deleteEmployee(epfNumber: string): Promise<void> {
    if (!isFirebaseConfigured()) return;
    try {
        await deleteDoc(doc(db, companyRef(), "employees", epfNumber));
    } catch (err) {
        console.warn("[FirebaseSync] deleteEmployee failed:", err);
    }
}

/**
 * Sync a daily cader report (+ training line details) to Firestore
 */
export async function syncCaderReport(
    report: DailyCaderReport,
    details: TrainingLineDetail[]
): Promise<void> {
    if (!isFirebaseConfigured()) return;
    try {
        const ref = doc(db, companyRef(), "daily_cader_reports", report.report_date);
        await setDoc(ref, {
            ...report,
            training_line_details: details,
            _synced_at: serverTimestamp(),
        });
    } catch (err) {
        console.warn("[FirebaseSync] syncCaderReport failed:", err);
    }
}

/**
 * Delete a cader report from Firestore
 */
export async function deleteCaderReport(reportDate: string): Promise<void> {
    if (!isFirebaseConfigured()) return;
    try {
        await deleteDoc(doc(db, companyRef(), "daily_cader_reports", reportDate));
    } catch (err) {
        console.warn("[FirebaseSync] deleteCaderReport failed:", err);
    }
}

/**
 * Write an audit log entry to Firestore
 */
export async function syncAuditLog(entry: {
    action: string;
    entity_type: string;
    entity_id?: string;
    details?: string;
    username: string;
    user_role?: string;
    machine_name?: string;
}): Promise<void> {
    if (!isFirebaseConfigured()) return;
    try {
        const col = collection(db, companyRef(), "audit_logs");
        await addDoc(col, {
            ...entry,
            timestamp: serverTimestamp(),
        });
    } catch (err) {
        console.warn("[FirebaseSync] syncAuditLog failed:", err);
    }
}
