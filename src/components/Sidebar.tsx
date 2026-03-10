import { useAuth } from "../context/AuthContext";
import { getVisibleNavigationItems } from "../controllers/NavigationController";
import { ROLES } from "../types/auth";
import { APP_CONFIG } from "../config/appConfig";
import { PageType } from "../models/Navigation";

export type { PageType };

interface SidebarProps {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
}

function Sidebar({ currentPage, setCurrentPage }: SidebarProps) {
  const { user, logout } = useAuth();
  const menuItems = getVisibleNavigationItems(user);

  const getRoleLabel = (role: string): string => {
    const roleInfo = ROLES.find(r => r.value === role);
    return roleInfo?.label || role;
  };

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case "admin": return "bg-red-500/15 text-red-100";
      case "hr_manager": return "bg-purple-500/20 text-purple-100";
      case "hr_staff": return "bg-blue-500/20 text-blue-100";
      case "viewer": return "bg-white/20 text-slate-100";
      default: return "bg-white/20 text-slate-100";
    }
  };

  return (
    <aside className="w-72 bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 min-h-screen flex flex-col border-r border-slate-800/80 shadow-xl">
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <img
          src="/logo.jpg"
          alt={APP_CONFIG.companyName}
          className="w-12 h-12 object-contain rounded-xl bg-white/10 p-1"
        />
        <div>
          <h1 className="text-lg font-semibold text-white">{APP_CONFIG.name}</h1>
          <p className="text-xs text-slate-300">{APP_CONFIG.companyName}</p>
        </div>
      </div>

      <nav className="mt-3 flex-1 px-3">
        {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl transition-all ${currentPage === item.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
            >
              <span className={`${currentPage === item.id ? "text-primary-600" : "text-slate-400"}`}>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
      </nav>

      {/* User Info Section */}
      {user && (
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-rose-200 bg-rose-500/10 border border-rose-400/30 rounded-xl hover:bg-rose-500/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      )}

      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-slate-400 text-center">Version {APP_CONFIG.version}</p>
      </div>
    </aside>
  );
}

export default Sidebar;
