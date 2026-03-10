import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FirebaseAuthProvider, useFirebaseAuth } from "./context/FirebaseAuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Sidebar, { PageType } from "./components/Sidebar";
import UpdateChecker from "./components/UpdateChecker";
import Footer from "./components/Footer";
import { getFirstEnabledFeature } from "./controllers/FeatureController";
import { renderNavigationPage, resolveNavigationPage } from "./controllers/NavigationController";
import {
  renderFirebaseAccessStage,
  renderLocalAccessStage,
  resolveFirebaseAccessStage,
  resolveLocalAccessStage,
} from "./controllers/AppAccessController";

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageType>(() => getFirstEnabledFeature("dashboard"));
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

  const localAccessStage = resolveLocalAccessStage(Boolean(user));
  if (!user) {
    return renderLocalAccessStage(localAccessStage);
  }

  return (
    <div className="flex h-screen overflow-hidden text-slate-900" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={(page) => {
          setCurrentPage(resolveNavigationPage(page));
          setShowTerms(false);
        }} 
      />
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="max-w-[1440px] mx-auto">
            {renderNavigationPage(
              { page: currentPage, showTerms, onOpenTerms: () => setShowTerms(true) },
              user
            )}
          </div>
        </main>
        <Footer />
      </div>
      <UpdateChecker />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <FirebaseAuthProvider>
        <AppAccessBoundary />
      </FirebaseAuthProvider>
    </ThemeProvider>
  );
}

function AppAccessBoundary() {
  const { status } = useFirebaseAuth();
  const firebaseStage = resolveFirebaseAccessStage(status);

  if (firebaseStage !== "local-auth") {
    return renderFirebaseAccessStage(firebaseStage);
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
