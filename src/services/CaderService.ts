/**
 * Cader Report Service
 * Handles all API calls related to daily cader reports,
 * with background Firebase sync after every write.
 */

import { invoke } from "@tauri-apps/api/core";
import type { DailyCaderReport, SaveCaderReportRequest } from "../types/employee";
import * as FirebaseSync from "./FirebaseSyncService";

export class CaderService {
    /** Save (create or update) a daily cader report */
    static async save(report: SaveCaderReportRequest): Promise<number> {
        try {
            const id = await invoke<number>("save_daily_cader_report", { report });
            // Sync to Firestore in the background (fire-and-forget)
            CaderService.getByDate(report.report_date).then(saved => {
                if (saved) FirebaseSync.syncCaderReport(saved, saved.training_line_details).catch(() => { });
            }).catch(() => { });
            return id;
        } catch (error) {
            throw new Error(`${error}`);
        }
    }

    /** Get cader report for a specific date (YYYY-MM-DD) */
    static async getByDate(reportDate: string): Promise<DailyCaderReport | null> {
        try {
            return await invoke<DailyCaderReport | null>("get_daily_cader_report", { reportDate });
        } catch {
            return null;
        }
    }

    /** Get report history (most recent N reports) */
    static async getHistory(limit: number = 30): Promise<DailyCaderReport[]> {
        try {
            return await invoke<DailyCaderReport[]>("get_cader_report_history", { limit });
        } catch {
            return [];
        }
    }

    /** Delete a report by date */
    static async delete(reportDate: string): Promise<void> {
        try {
            await invoke("delete_daily_cader_report", { reportDate });
            // Sync deletion to Firestore in the background
            FirebaseSync.deleteCaderReport(reportDate).catch(() => { });
        } catch (error) {
            throw new Error(`${error}`);
        }
    }

    /** Get today's date as YYYY-MM-DD */
    static todayString(): string {
        return new Date().toISOString().split("T")[0];
    }
}
