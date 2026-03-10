import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FirebaseAuthProvider, useFirebaseAuth } from "./context/FirebaseAuthContext";
import EmployeeManagement from "./components/EmployeeManagement";
import Dashboard from "./components/Dashboard";
import Sidebar, { PageType } from "./components/Sidebar";
import UpdateChecker from "./components/UpdateChecker";
import WorkInProgress from "./components/WorkInProgress";
import Footer from "./components/Footer";
import Login from "./components/Login";
import UserManagement from "./components/UserManagement";
import DatabaseBackup from "./components/DatabaseBackup";
import AuditLogViewer from "./components/AuditLogViewer";
import DailyCaderReport from "./components/DailyCaderReport";
import FirebaseLogin from "./components/FirebaseLogin";
import About from "./components/About";
import TermsAndConditions from "./components/TermsAndConditions";

const TERMS_ACCEPTANCE_KEY = "hrm_terms_accepted_v2";

function UserAgreementGate() {
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

  const acceptAndContinue = () => {
    localStorage.setItem(TERMS_ACCEPTANCE_KEY, new Date().toISOString());
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">User Agreement Required</h1>
        <p className="text-gray-700 mb-4">
          You must read and accept the Terms & Conditions before using this software.
          Acceptance is mandatory for first-time access.
        </p>

        <div className="p-4 rounded-lg border border-red-300 bg-red-50 mb-6">
          <p className="text-red-700 font-semibold">
            IMPORTANT NOTICE: Hosting, backend operations, software updates, maintenance,
            and support are paid services. Rates are market-dependent and may change over time.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary" onClick={() => setShowFullTerms(true)}>
            Read Full Terms
          </button>
          <button className="btn-primary" onClick={acceptAndContinue}>
            I Agree & Continue to Login
          </button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageType>("dashboard");
  const [showTerms, setShowTerms] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initDb = async () => {
      try {
        await invoke("init_database");
        setDbInitialized(true);
      } catch (error) {
        console.error("Failed to initialize database:", error);
        setInitError(String(error));
      }
    };
    initDb();
  }, []);

  if (initError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Database Error</h2>
          <p className="text-gray-600 mb-4">Failed to initialize the database:</p>
          <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dbInitialized || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {!dbInitialized ? "Initializing database..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    const hasAcceptedTerms = !!localStorage.getItem(TERMS_ACCEPTANCE_KEY);
    if (!hasAcceptedTerms) {
      return <UserAgreementGate />;
    }
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "cader":
        return <DailyCaderReport />;
      case "employees":
        return <EmployeeManagement />;

      case "jobdesk":
        return (
          <WorkInProgress
            title="Job Desk"
            description="Job designation and department management will be available here."
            icon="💼"
          />
        );
      case "leave":
        return (
          <WorkInProgress
            title="Leave Management"
            description="Employee leave requests, approvals, and leave balance tracking will be available here."
            icon="🏖️"
          />
        );
      case "attendance":
        return (
          <WorkInProgress
            title="Attendance"
            description="Fingerprint attendance import from Excel and daily attendance tracking will be available here."
            icon="📋"
          />
        );
      case "payroll":
        return (
          <WorkInProgress
            title="Payroll"
            description="Salary calculation, payslips, and payroll reports will be available here."
            icon="💰"
          />
        );
      case "admin":
        // Show User Management for users with permission, otherwise show WIP
        if (user.permissions.can_manage_users) {
          return <UserManagement />;
        }
        return (
          <WorkInProgress
            title="Admin Panel"
            description="You don't have permission to access user management."
            icon="🔒"
          />
        );
      case "settings":
        return (
          <WorkInProgress
            title="Settings"
            description="Application settings, backup/restore, and configuration options will be available here."
            icon="⚙️"
          />
        );
      case "backup":
        return <DatabaseBackup />;
      case "audit":
        // Show Audit Log Viewer for users with permission
        if (user.permissions.can_view_audit_logs) {
          return <AuditLogViewer />;
        }
        return (
          <WorkInProgress
            title="Activity Logs"
            description="You don't have permission to view activity logs."
            icon="🔒"
          />
        );
      case "about":
        if (showTerms) {
          return <TermsAndConditions />;
        }
        return <About onOpenTerms={() => setShowTerms(true)} />;
      case "terms":
        return <TermsAndConditions />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={(page) => {
          setCurrentPage(page);
          setShowTerms(false);
        }} 
      />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
        <Footer />
      </div>
      <UpdateChecker />
    </div>
  );
}

function App() {
  return (
    <FirebaseAuthProvider>
      <FirebaseGate>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </FirebaseGate>
    </FirebaseAuthProvider>
  );
}

/**
 * FirebaseGate — shows FirebaseLogin until the user is authenticated and allowlisted.
 * If Firebase is unconfigured (.env not set), renders children directly.
 */
function FirebaseGate({ children }: { children: React.ReactNode }) {
  const { status } = useFirebaseAuth();

  // No .env → skip Firebase gate entirely (local-only mode)
  if (status === "unconfigured") return <>{children}</>;

  // Authenticated and allowed → show the HRM app
  if (status === "allowed") return <>{children}</>;

  // All other states → show the Firebase login/access-denied screen
  return <FirebaseLogin />;
}

export default App;
