import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Building2,
  Activity,
  AlertTriangle,
  Calendar,
  ClipboardList,
  Smartphone,
  Video,
  PhoneCall,
  BrainCircuit,
  Users2,
  FileCheck2,
  Archive,
  Bell,
  Users,
  History,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  ExternalLink
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Overview Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects & Institutions', path: '/projects', icon: Building2 },
  { name: 'Live Monitoring', path: '/live-monitoring', icon: Activity },
  { name: 'Surprise Inspections', path: '/surprise-inspections', icon: AlertTriangle, badge: 'AI Engine' },
  { name: 'Inspection Calendar', path: '/calendar', icon: Calendar },
  { name: 'Assignments', path: '/assignments', icon: ClipboardList },
  { name: 'Mobile Workspace', path: '/mobile-workspace', icon: Smartphone, badge: 'Field PWA' },
  { name: 'CCTV Surveillance', path: '/cctv', icon: Video },
  { name: 'Video Verification', path: '/video-verification', icon: PhoneCall },
  { name: 'AI Risk Analytics', path: '/ai-analytics', icon: BrainCircuit, badge: 'ML' },
  { name: 'Attendance Analytics', path: '/attendance', icon: Users2 },
  { name: 'Inspection Reports', path: '/reports', icon: FileCheck2 },
  { name: 'Evidence Repository', path: '/evidence', icon: Archive },
  { name: 'Alerts & Notifications', path: '/alerts', icon: Bell },
  { name: 'User Management', path: '/users', icon: Users, roles: ['admin'] },
  { name: 'Audit Logs', path: '/audit-logs', icon: History, roles: ['admin', 'auditor'] },
  { name: 'System Settings', path: '/settings', icon: Settings },
];

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-72'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo / Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  NigraniAI
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    SIH26095
                  </span>
                </span>
                <span className="text-xs text-slate-400 truncate">MoSJE Monitoring Platform</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Scrollable Nav List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between truncate">
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/20">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/40">
            <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-sm shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Authorized User'}</p>
                <p className="text-[11px] text-slate-400 capitalize truncate">{user?.role?.replace('_', ' ') || 'Official'}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors ml-auto"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Command Center
              </span>
              <span className="text-xs text-slate-400 hidden md:inline">• Ministry of Social Justice & Empowerment</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-medium text-slate-700">Prototype Environment</span>
              <span className="text-[11px] text-slate-400">SIH 2026 Evaluation Ready</span>
            </div>
            <button
              onClick={() => navigate('/mobile-workspace')}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Inspector App</span>
            </button>
          </div>
        </header>

        {/* Page View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/70">
          {children}
        </main>
      </div>
    </div>
  );
};
