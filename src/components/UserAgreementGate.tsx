import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import TermsAndConditions from "./TermsAndConditions";

interface UserAgreementGateProps {
  onAccept: () => void;
}

function UserAgreementGate({ onAccept }: UserAgreementGateProps) {
  const { theme, setTheme, isDark } = useTheme();
  const [showFullTerms, setShowFullTerms] = useState(false);

  if (showFullTerms) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-800">User Agreement (Mandatory)</h1>
          <button className="btn-secondary" onClick={() => setShowFullTerms(false)}>
            Back
          </button>
        </div>
        <TermsAndConditions />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)"
          : "linear-gradient(135deg, #e0e7ff 0%, #f8fafc 55%, #dbeafe 100%)",
      }}
    >
      <div
        className="rounded-3xl shadow-2xl border w-full max-w-2xl p-8"
        style={{
          backgroundColor: "var(--bg-primary)",
          borderColor: "var(--border-color)",
          color: "var(--text-primary)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold">User Agreement Required</h1>
            <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
              Please review and accept the Terms & Conditions before first login.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl p-1.5 border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
            <button
              type="button"
              onClick={() => setTheme("light")}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: theme === "light" ? "var(--color-primary)" : "transparent",
                color: theme === "light" ? "#fff" : "var(--text-secondary)",
              }}
            >
              ☀️ Light
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: theme === "dark" ? "var(--color-primary)" : "transparent",
                color: theme === "dark" ? "#fff" : "var(--text-secondary)",
              }}
            >
              🌙 Dark
            </button>
          </div>
        </div>
        <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
          You must read and accept the Terms & Conditions before using this software.
          Acceptance is mandatory for first-time access.
        </p>

        <div className="p-4 rounded-2xl border mb-6" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            You can continue with your preferred appearance right away. Theme settings can still be changed later from Settings.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary" onClick={() => setShowFullTerms(true)}>
            Read Full Terms
          </button>
          <button className="btn-primary" onClick={onAccept}>
            I Agree & Continue to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserAgreementGate;
