import { useState } from "react";
import { open } from "@tauri-apps/plugin-shell";
import { APP_CONFIG, LEGAL_CONFIG } from "../config/appConfig";

interface AboutProps {
  onOpenTerms: () => void;
}

function About({ onOpenTerms }: AboutProps) {
  const [showSupportOptions, setShowSupportOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  const openExternal = async (url: string) => {
    if (!url) return;
    await open(url);
  };

  const handleSupport = () => {
    setShowSupportOptions((prev) => !prev);
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(APP_CONFIG.developerEmail);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="rounded-xl border shadow-sm p-6 md:p-8" style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border-color)" }}>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>About</h2>
        <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
          {APP_CONFIG.name} is developed for {APP_CONFIG.companyName} to manage employee records, reports, audits, and HR operations.
        </p>

        <div className="space-y-4 text-sm md:text-base">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 py-3 border-b" style={{ borderColor: "var(--border-color)" }}>
            <span style={{ color: "var(--text-tertiary)" }}>Application</span>
            <span className="md:col-span-2 font-medium" style={{ color: "var(--text-primary)" }}>{APP_CONFIG.name}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 py-3 border-b" style={{ borderColor: "var(--border-color)" }}>
            <span style={{ color: "var(--text-tertiary)" }}>Version</span>
            <span className="md:col-span-2 font-medium" style={{ color: "var(--text-primary)" }}>{APP_CONFIG.version}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 py-3 border-b" style={{ borderColor: "var(--border-color)" }}>
            <span style={{ color: "var(--text-tertiary)" }}>Copyright</span>
            <span className="md:col-span-2 font-medium" style={{ color: "var(--text-primary)" }}>© {new Date().getFullYear()} {APP_CONFIG.companyName}. All rights reserved.</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 py-3 border-b" style={{ borderColor: "var(--border-color)" }}>
            <span style={{ color: "var(--text-tertiary)" }}>Developer</span>
            <span className="md:col-span-2 font-medium" style={{ color: "var(--text-primary)" }}>{APP_CONFIG.developerName}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 py-3">
            <span style={{ color: "var(--text-tertiary)" }}>Usage Notice</span>
            <span className="md:col-span-2" style={{ color: "var(--text-primary)" }}>{LEGAL_CONFIG.licenseSummary}</span>
          </div>
        </div>

        <div className="mt-8 p-5 rounded-xl border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Legal & Support</h3>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Review terms, contact support, or reach the developer through the links below.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={onOpenTerms} className="btn-primary">
                View Terms & Conditions
              </button>
              <button onClick={handleSupport} className="btn-secondary">
                {showSupportOptions ? "Hide Support Options" : "Contact Support"}
              </button>
            </div>
          </div>
          {showSupportOptions && (
            <div className="mt-4 rounded-xl border p-4" style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border-color)" }}>
              <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                Support opens inside the app now. Choose the channel you prefer.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={copyEmail} className="btn-secondary">{copied ? "Email Copied" : "Copy Email"}</button>
                <button onClick={() => openExternal(`mailto:${APP_CONFIG.developerEmail}`)} className="btn-secondary">Open Email App</button>
                <button onClick={() => openExternal(APP_CONFIG.githubUrl)} className="btn-secondary">GitHub</button>
                <button onClick={() => openExternal(APP_CONFIG.linkedinUrl)} className="btn-secondary">LinkedIn</button>
                <button onClick={() => openExternal(APP_CONFIG.websiteUrl)} className="btn-secondary">Website</button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Contact Developer</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p style={{ color: "var(--text-tertiary)" }}>Name</p>
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>{APP_CONFIG.developerName}</p>
              </div>
              <div>
                <p style={{ color: "var(--text-tertiary)" }}>Email</p>
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>{APP_CONFIG.developerEmail}</p>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={() => openExternal(`mailto:${APP_CONFIG.developerEmail}`)} className="btn-secondary">Email</button>
                <button onClick={() => openExternal(APP_CONFIG.githubUrl)} className="btn-secondary">GitHub</button>
                <button onClick={() => openExternal(APP_CONFIG.linkedinUrl)} className="btn-secondary">LinkedIn</button>
                <button onClick={() => openExternal(APP_CONFIG.websiteUrl)} className="btn-secondary">Website</button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Important Links</h3>
            <div className="space-y-3 text-sm">
              <p style={{ color: "var(--text-secondary)" }}>
                Quick redirects for legal review, source profile, business contact, and official presence.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={onOpenTerms} className="btn-secondary">Terms</button>
                <button onClick={handleSupport} className="btn-secondary">Support</button>
                <button onClick={() => openExternal(APP_CONFIG.githubUrl)} className="btn-secondary">GitHub Profile</button>
                <button onClick={() => openExternal(APP_CONFIG.linkedinUrl)} className="btn-secondary">LinkedIn Profile</button>
                <button onClick={() => openExternal(APP_CONFIG.websiteUrl)} className="btn-secondary">Personal Site</button>
                <button
                  className="btn-secondary opacity-60 cursor-not-allowed"
                  disabled
                  title="Company website not available yet"
                >
                  Company Site (Soon)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
