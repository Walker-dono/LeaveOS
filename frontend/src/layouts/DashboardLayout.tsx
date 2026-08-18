import React, { ReactNode } from 'react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Calendar,
  LogOut,
  Sparkles,
  Shield,
  Users,
  Briefcase,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  activeRoleTab: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeRoleTab,
  onRoleChange,
}) => {
  const { user, logout, quickLogin } = useAuth();

  const roleBadges: Record<UserRole, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    HR_ADMIN: {
      label: 'HR Admin',
      bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      text: 'text-purple-400',
      icon: <Shield className="w-3.5 h-3.5" />,
    },
    MANAGER: {
      label: 'Manager',
      bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      text: 'text-blue-400',
      icon: <Users className="w-3.5 h-3.5" />,
    },
    EMPLOYEE: {
      label: 'Employee',
      bg: 'bg-brand-500/10 border-brand-500/30 text-brand-400',
      text: 'text-brand-400',
      icon: <Briefcase className="w-3.5 h-3.5" />,
    },
  };

  const currentBadge = user ? roleBadges[user.role] : roleBadges.EMPLOYEE;

  const handleQuickSwitch = async (role: UserRole) => {
    try {
      await quickLogin(role);
      onRoleChange(role);
    } catch (e) {
      console.error('Failed to switch role', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Calendar className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                  LeaveOS
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  Cloud Native
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Intelligent Leave Management & Forecasting</p>
            </div>
          </div>

          {/* Quick Role Switcher (Portfolio Feature) */}
          <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-xs font-medium text-slate-400 px-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Demo Switcher:
            </span>
            {(['EMPLOYEE', 'MANAGER', 'HR_ADMIN'] as UserRole[]).map((r) => {
              const isActive = user?.role === r;
              return (
                <button
                  key={r}
                  onClick={() => handleQuickSwitch(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {roleBadges[r].icon}
                  {roleBadges[r].label}
                </button>
              );
            })}
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-200">{user.full_name}</div>
                  <div className="text-xs text-slate-400 flex items-center justify-end gap-1.5">
                    {user.department_name && (
                      <span className="text-slate-400">{user.department_name} •</span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded border text-[10px] font-medium ${currentBadge.bg}`}>
                      {currentBadge.label}
                    </span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-brand-400">
                  {user.full_name.charAt(0)}
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Role Navigation Banner for Mobile */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-2 flex justify-center gap-2">
        {(['EMPLOYEE', 'MANAGER', 'HR_ADMIN'] as UserRole[]).map((r) => (
          <button
            key={r}
            onClick={() => handleQuickSwitch(r)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium ${
              user?.role === r
                ? 'bg-slate-800 text-brand-400 border border-slate-700'
                : 'text-slate-400'
            }`}
          >
            {roleBadges[r].label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Modern Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} LeaveOS — Enterprise Staff Leave Management & Trend Forecasting.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              FastAPI API Live
            </span>
            <span className="text-slate-600">|</span>
            <span>PostgreSQL Engine</span>
            <span className="text-slate-600">|</span>
            <span>Linear Regression ML</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
