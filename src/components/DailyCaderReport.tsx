import { useState, useEffect } from "react";
import { CaderService } from "../services/CaderService";
import type { TrainingLineDetail, SaveCaderReportRequest, DailyCaderReport as DailyCaderReportType } from "../types/employee";
import { useAuth } from "../context/AuthContext";

const emptyForm = (): SaveCaderReportRequest => ({
    report_date: CaderService.todayString(),
    budget_cader: 0,
    actual_cader: 0,
    present_cader: 0,
    absent_count: 0,
    absent_percent: 0,
    training_line_cader: 0,
    training_line_present: 0,
    training_line_absent_count: 0,
    training_line_absent_percent: 0,
    lto_up_to_date: 0,
    training_line_details: [],
});

// ─── PDF via hidden iframe ────────────────────────────────────────────────────
function printCaderReport(report: SaveCaderReportRequest, date: string) {
    const tlRows = report.training_line_details.map(d => `
    <tr>
      <td>${d.line_name}</td>
      <td style="text-align:center">${d.actual_cader}</td>
      <td style="text-align:center;color:#16a34a;font-weight:600">${d.present_cader}</td>
      <td style="text-align:center;color:#dc2626">${d.absent_count}</td>
      <td style="text-align:center;color:#dc2626">${d.absent_percent}%</td>
    </tr>`).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Cader Report – ${date}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;padding:28px;color:#111;font-size:13px}
    h1{color:#1e40af;font-size:20px;margin-bottom:4px}
    .subtitle{color:#6b7280;margin-bottom:20px;font-size:12px}
    .badge{display:inline-block;background:#2563eb;color:#fff;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:18px}
    .section{font-size:12px;font-weight:700;color:#1e40af;margin:16px 0 8px;text-transform:uppercase;letter-spacing:.05em;border-left:4px solid #2563eb;padding-left:8px}
    .kpi-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:4px}
    .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 6px;text-align:center}
    .kpi .val{font-size:22px;font-weight:800}
    .kpi .lbl{font-size:10px;color:#64748b;margin-top:2px}
    .tl-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
    table{width:100%;border-collapse:collapse;margin-top:6px}
    th{background:#2563eb;color:#fff;padding:8px;text-align:left;font-size:12px}
    td{padding:7px 8px;border-bottom:1px solid #e5e7eb;font-size:12px}
    tr:nth-child(even){background:#f9fafb}
    .footer{margin-top:24px;text-align:center;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px}
    @media print{@page{margin:15mm}body{padding:0}}
  </style>
</head>
<body>
  <h1>New Lanka Clothing (Pvt) Ltd</h1>
  <div class="subtitle">Human Resource Management System</div>
  <div class="badge">📋 Daily Cader Report — ${date}</div>
  <div class="section">Main Cader</div>
  <div class="kpi-grid">
    <div class="kpi"><div class="val">${report.budget_cader}</div><div class="lbl">Budget Cader</div></div>
    <div class="kpi"><div class="val" style="color:#2563eb">${report.actual_cader}</div><div class="lbl">Actual Cader</div></div>
    <div class="kpi"><div class="val" style="color:#16a34a">${report.present_cader}</div><div class="lbl">Present</div></div>
    <div class="kpi"><div class="val" style="color:#dc2626">${report.absent_count}</div><div class="lbl">Absent</div></div>
    <div class="kpi"><div class="val" style="color:#ea580c">${report.absent_percent}%</div><div class="lbl">Absent %</div></div>
    <div class="kpi"><div class="val" style="color:#7c3aed">${report.lto_up_to_date}</div><div class="lbl">LTO</div></div>
  </div>
  <div class="section">Training Line Summary</div>
  <div class="tl-grid">
    <div class="kpi"><div class="val">${report.training_line_cader}</div><div class="lbl">TL Cader</div></div>
    <div class="kpi"><div class="val" style="color:#16a34a">${report.training_line_present}</div><div class="lbl">TL Present</div></div>
    <div class="kpi"><div class="val" style="color:#dc2626">${report.training_line_absent_count}</div><div class="lbl">TL Absent</div></div>
    <div class="kpi"><div class="val" style="color:#dc2626">${report.training_line_absent_percent}%</div><div class="lbl">TL Absent %</div></div>
  </div>
  ${report.training_line_details.length > 0 ? `
  <div class="section">Training Line Breakdown</div>
  <table>
    <thead><tr><th>Line</th><th>Actual</th><th>Present</th><th>Absent</th><th>Absent %</th></tr></thead>
    <tbody>${tlRows}</tbody>
  </table>` : ""}
  <div class="footer">Generated on ${new Date().toLocaleString("en-GB")} · HRM System – New Lanka Clothing (Pvt) Ltd</div>
</body>
</html>`;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(iframe);
    iframe.contentDocument!.open();
    iframe.contentDocument!.write(html);
    iframe.contentDocument!.close();
    iframe.contentWindow!.focus();
    setTimeout(() => {
        iframe.contentWindow!.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 400);
}

// ─── Component ────────────────────────────────────────────────────────────────
function DailyCaderReport() {
    const { user } = useAuth();
    const [form, setForm] = useState<SaveCaderReportRequest>(emptyForm());
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<DailyCaderReportType[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    useEffect(() => {
        if (form.report_date) loadReport(form.report_date);
    }, [form.report_date]);

    const loadReport = async (date: string) => {
        setLoading(true);
        try {
            const report = await CaderService.getByDate(date);
            if (report) {
                setForm({
                    report_date: report.report_date,
                    budget_cader: report.budget_cader,
                    actual_cader: report.actual_cader,
                    present_cader: report.present_cader,
                    absent_count: report.absent_count,
                    absent_percent: report.absent_percent,
                    training_line_cader: report.training_line_cader,
                    training_line_present: report.training_line_present,
                    training_line_absent_count: report.training_line_absent_count,
                    training_line_absent_percent: report.training_line_absent_percent,
                    lto_up_to_date: report.lto_up_to_date,
                    training_line_details: report.training_line_details,
                });
            } else {
                setForm((prev) => ({ ...emptyForm(), report_date: prev.report_date }));
            }
        } catch { /* no report */ }
        finally { setLoading(false); }
    };

    const numField = (key: keyof SaveCaderReportRequest) => ({
        value: form[key] as number,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setForm((p) => ({ ...p, [key]: parseFloat(e.target.value) || 0 })),
    });

    const addTL = () =>
        setForm((p) => ({
            ...p,
            training_line_details: [
                ...p.training_line_details,
                { line_name: "", actual_cader: 0, present_cader: 0, absent_count: 0, absent_percent: 0 },
            ],
        }));

    const removeTL = (idx: number) =>
        setForm((p) => ({ ...p, training_line_details: p.training_line_details.filter((_, i) => i !== idx) }));

    const updateTL = (idx: number, field: keyof TrainingLineDetail, value: string | number) =>
        setForm((p) => ({
            ...p,
            training_line_details: p.training_line_details.map((d, i) => i === idx ? { ...d, [field]: value } : d),
        }));

    const handleSave = async () => {
        setSaving(true); setSuccessMsg(null); setErrorMsg(null);
        try {
            await CaderService.save(form);
            setSuccessMsg(`✅ Report for ${form.report_date} saved.`);
        } catch (err) { setErrorMsg(`Save failed: ${err}`); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) { setDeleteConfirm(true); return; }
        try {
            await CaderService.delete(form.report_date);
            setSuccessMsg(`Deleted report for ${form.report_date}.`);
            setDeleteConfirm(false);
            setForm((p) => ({ ...emptyForm(), report_date: p.report_date }));
        } catch (err) { setErrorMsg(`Delete failed: ${err}`); setDeleteConfirm(false); }
    };

    const loadHistory = async () => {
        setHistoryLoading(true);
        setHistory(await CaderService.getHistory(30));
        setHistoryLoading(false);
    };

    const canEdit = user?.permissions.can_edit_employees || user?.permissions.can_add_employees;

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Daily Cader Report</h1>
                    <p className="text-sm text-gray-500 mt-1">{form.report_date}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => printCaderReport(form, form.report_date)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print / Export PDF
                    </button>
                    <button onClick={() => { if (!showHistory) loadHistory(); setShowHistory(v => !v); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {showHistory ? "Hide History" : "History"}
                    </button>
                </div>
            </div>

            {/* Feedback */}
            {successMsg && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    {successMsg}<button className="ml-auto" onClick={() => setSuccessMsg(null)}>✕</button>
                </div>
            )}
            {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {errorMsg}<button className="ml-auto" onClick={() => setErrorMsg(null)}>✕</button>
                </div>
            )}

            {/* History panel */}
            {showHistory && (
                <div className="card">
                    <h2 className="text-base font-semibold text-gray-800 mb-3">Recent Reports</h2>
                    {historyLoading ? (
                        <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" /></div>
                    ) : history.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">No reports yet.</p>
                    ) : (
                        <div className="overflow-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b">
                                        {["Date", "Budget", "Actual", "Present", "Absent", "Absent %", ""].map(h =>
                                            <th key={h} className="pb-2 pr-4 font-medium text-xs">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(r => (
                                        <tr key={r.report_date} className="border-b hover:bg-gray-50">
                                            <td className="py-2 pr-4 font-medium text-primary-700">{r.report_date}</td>
                                            <td className="py-2 pr-4">{r.budget_cader}</td>
                                            <td className="py-2 pr-4">{r.actual_cader}</td>
                                            <td className="py-2 pr-4 text-green-700 font-medium">{r.present_cader}</td>
                                            <td className="py-2 pr-4 text-red-600">{r.absent_count}</td>
                                            <td className="py-2 pr-4 text-red-600">{r.absent_percent}%</td>
                                            <td className="py-2">
                                                <button onClick={() => { setForm(p => ({ ...p, report_date: r.report_date })); setShowHistory(false); }}
                                                    className="text-xs text-primary-600 hover:underline">Load</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Date */}
            <div className="card">
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
                <input type="date" value={form.report_date} max={CaderService.todayString()}
                    onChange={e => setForm(p => ({ ...p, report_date: e.target.value }))}
                    className="input-field w-48" />
                {loading && <span className="ml-3 text-sm text-gray-400 animate-pulse">Loading…</span>}
            </div>

            {/* Main Cader */}
            <div className="card">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-6 bg-primary-600 rounded-full" />
                    <h2 className="text-lg font-semibold text-gray-800">Main Cader Details</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {([
                        { label: "Budget Cader", key: "budget_cader" as const },
                        { label: "Actual Cader", key: "actual_cader" as const },
                        { label: "Present Cader", key: "present_cader" as const },
                        { label: "Absent Count", key: "absent_count" as const },
                        { label: "Absent %", key: "absent_percent" as const },
                        { label: "Up to Date LTO", key: "lto_up_to_date" as const },
                    ]).map(({ label, key }) => (
                        <div key={key}>
                            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                            <input type="number" min={0} step={key === "absent_percent" ? 0.1 : 1}
                                {...numField(key)} disabled={!canEdit} className="input-field text-center" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Training Line Summary */}
            <div className="card">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                    <h2 className="text-lg font-semibold text-gray-800">Training Line Summary</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {([
                        { label: "TL Cader", key: "training_line_cader" as const },
                        { label: "TL Present", key: "training_line_present" as const },
                        { label: "TL Absent Count", key: "training_line_absent_count" as const },
                        { label: "TL Absent %", key: "training_line_absent_percent" as const },
                    ]).map(({ label, key }) => (
                        <div key={key}>
                            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                            <input type="number" min={0} step={key === "training_line_absent_percent" ? 0.1 : 1}
                                {...numField(key)} disabled={!canEdit} className="input-field text-center" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Training Line Breakdown */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-teal-500 rounded-full" />
                        <h2 className="text-lg font-semibold text-gray-800">Training Line Breakdown</h2>
                        <span className="text-xs text-gray-400">(e.g. TMO, OJT)</span>
                    </div>
                    {canEdit && (
                        <button onClick={addTL}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>Add Line
                        </button>
                    )}
                </div>
                {form.training_line_details.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                        No training line details.{canEdit ? " Click \"Add Line\" to add one." : ""}
                    </p>
                ) : (
                    <div className="space-y-2">
                        <div className="grid grid-cols-6 gap-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                            <div className="col-span-2">Line Name</div>
                            <div className="text-center">Actual</div>
                            <div className="text-center">Present</div>
                            <div className="text-center">Absent</div>
                            <div className="text-center">Absent %</div>
                        </div>
                        {form.training_line_details.map((detail, idx) => (
                            <div key={idx} className="grid grid-cols-6 gap-3 items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="col-span-2 flex items-center gap-2">
                                    <input type="text" placeholder="e.g. TMO" value={detail.line_name}
                                        onChange={e => updateTL(idx, "line_name", e.target.value)}
                                        disabled={!canEdit} className="input-field text-sm flex-1" />
                                    {canEdit && (
                                        <button onClick={() => removeTL(idx)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                {(["actual_cader", "present_cader", "absent_count", "absent_percent"] as const).map(field => (
                                    <input key={field} type="number" min={0} step={field === "absent_percent" ? 0.1 : 1}
                                        value={detail[field]}
                                        onChange={e => updateTL(idx, field, parseFloat(e.target.value) || 0)}
                                        disabled={!canEdit} className="input-field text-center text-sm" />
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Save / Delete */}
            {canEdit && (
                <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={handleSave} disabled={saving || loading} className="btn-primary flex items-center gap-2">
                        {saving
                            ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Saving…</>
                            : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>Save Report</>}
                    </button>
                    {user?.permissions.can_delete_employees && (
                        deleteConfirm ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-red-600 font-medium">Confirm delete for {form.report_date}?</span>
                                <button onClick={handleDelete} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700">Yes, Delete</button>
                                <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                            </div>
                        ) : (
                            <button onClick={() => setDeleteConfirm(true)}
                                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                                Delete Report
                            </button>
                        )
                    )}
                </div>
            )}
        </div>
    );
}

export default DailyCaderReport;
