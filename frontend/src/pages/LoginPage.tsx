import React, { useState } from 'react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Calendar,
  Shield,
  Users,
  Briefcase,
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (role: UserRole) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, quickLogin, isLoading } = useAuth();
  const [email, setEmail] = useState<string>('hradmin@leaveos.demo');
  const [password, setPassword] = useState<string>('password123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      onLoginSuccess(user.role);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.detail || 'Authentication failed. Check your email and password.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuick = async (role: UserRole) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const user = await quickLogin(role);
      onLoginSuccess(user.role);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || `Failed to login as ${role}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 shadow-xl shadow-brand-500/20 mb-4">
          <Calendar className="w-8 h-8 text-slate-950" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          LeaveOS
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
          Cloud-native staff leave management system with role-based workflows and ML forecasting.
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Quick Demo Login Section (DECISIONS.md #7) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> One-Click Demo Access
              </span>
              <span className="text-[10px] text-slate-500">Preset Seed Accounts</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuick('HR_ADMIN')}
                disabled={isSubmitting}
                className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/20 text-purple-300 flex flex-col items-center text-center transition-all group"
              >
                <Shield className="w-4 h-4 mb-1 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">HR Admin</span>
                <span className="text-[10px] text-purple-400/70 mt-0.5">Analytics</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuick('MANAGER')}
                disabled={isSubmitting}
                className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-400 hover:bg-blue-500/20 text-blue-300 flex flex-col items-center text-center transition-all group"
              >
                <Users className="w-4 h-4 mb-1 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Manager</span>
                <span className="text-[10px] text-blue-400/70 mt-0.5">Approvals</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuick('EMPLOYEE')}
                disabled={isSubmitting}
                className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 hover:border-brand-400 hover:bg-brand-500/20 text-brand-300 flex flex-col items-center text-center transition-all group"
              >
                <Briefcase className="w-4 h-4 mb-1 text-brand-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Employee</span>
                <span className="text-[10px] text-brand-400/70 mt-0.5">My Leaves</span>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase font-semibold">
              Or sign in with email
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Custom Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-brand-500 to-emerald-400 hover:from-brand-400 hover:to-emerald-300 transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                'Authenticating...'
              ) : (
                <>
                  Sign In <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Feature Highlights */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" /> Working-day rules
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" /> Atomic balance sync
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" /> JWT auth
          </span>
        </div>
      </div>
    </div>
  );
};
