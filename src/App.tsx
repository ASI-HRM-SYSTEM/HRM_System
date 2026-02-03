import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import EmployeeManagement from "./components/EmployeeManagement";
import Dashboard from "./components/Dashboard";
import Sidebar, { PageType } from "./components/Sidebar";
import UpdateChecker from "./components/UpdateChecker";
import WorkInProgress from "./components/WorkInProgress";

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("dashboard");
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    const initDb = async () => {
      try {
        await invoke("init_database");
        setDbInitialized(true);
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    };
    initDb();
  }, []);

  if (!dbInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing database...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
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
        return (
          <WorkInProgress 
            title="Admin Panel" 
            description="User management, roles, permissions, and system administration will be available here."
            icon="👤"
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
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
      <UpdateChecker />
    </div>
  );
}

export default App;
