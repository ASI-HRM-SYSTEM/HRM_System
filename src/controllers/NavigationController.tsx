import About from "../components/About";
import AuditLogViewer from "../components/AuditLogViewer";
import Dashboard from "../components/Dashboard";
import DailyCaderReport from "../components/DailyCaderReport";
import DatabaseBackup from "../components/DatabaseBackup";
import EmployeeManagement from "../components/EmployeeManagement";
import Settings from "../components/Settings";
import TermsAndConditions from "../components/TermsAndConditions";
import UserManagement from "../components/UserManagement";
import WorkInProgress from "../components/WorkInProgress";
import { NAVIGATION_MENU_ITEMS, WORK_IN_PROGRESS_PAGES } from "../config/navigationConfig";
import type { UserSession } from "../types/auth";
import { filterEnabledFeatures, getFirstEnabledFeature, isFeatureEnabled } from "./FeatureController";
import type { NavigationRenderContext, PageType } from "../models/Navigation";

const canAccessByPermission = (page: PageType, user: UserSession | null): boolean => {
  if (!user) return false;
  if (page === "admin") return user.permissions.can_manage_users;
  if (page === "backup") return user.permissions.can_backup_database;
  if (page === "audit") return user.permissions.can_view_audit_logs;
  return true;
};

export const getVisibleNavigationItems = (user: UserSession | null) => {
  return filterEnabledFeatures(NAVIGATION_MENU_ITEMS).filter((item) => canAccessByPermission(item.id, user));
};

export const resolveNavigationPage = (requestedPage: PageType): PageType => {
  return isFeatureEnabled(requestedPage) ? requestedPage : getFirstEnabledFeature("dashboard");
};

export const renderNavigationPage = ({ page, showTerms, onOpenTerms }: NavigationRenderContext, user: UserSession) => {
  if (!isFeatureEnabled(page)) {
    return (
      <WorkInProgress
        title="Feature Disabled"
        description="This module is disabled for this customer deployment."
        icon="🧩"
      />
    );
  }

  const wipConfig = WORK_IN_PROGRESS_PAGES[page];
  if (wipConfig) {
    return (
      <WorkInProgress
        title={wipConfig.title}
        description={wipConfig.description}
        icon={wipConfig.icon}
      />
    );
  }

  switch (page) {
    case "dashboard":
      return <Dashboard />;
    case "cader":
      return <DailyCaderReport />;
    case "employees":
      return <EmployeeManagement />;
    case "admin":
      if (user.permissions.can_manage_users) return <UserManagement />;
      return <WorkInProgress title="Admin Panel" description="You don't have permission to access user management." icon="🔒" />;
    case "settings":
      return <Settings />;
    case "backup":
      if (user.permissions.can_backup_database) return <DatabaseBackup />;
      return <WorkInProgress title="Database" description="You don't have permission to access database backup." icon="🔒" />;
    case "audit":
      if (user.permissions.can_view_audit_logs) return <AuditLogViewer />;
      return <WorkInProgress title="Activity Logs" description="You don't have permission to view activity logs." icon="🔒" />;
    case "about":
      if (showTerms) return <TermsAndConditions />;
      return <About onOpenTerms={onOpenTerms} />;
    case "terms":
      return <TermsAndConditions />;
    default:
      return <Dashboard />;
  }
};
