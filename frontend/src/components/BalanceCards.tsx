import React from 'react';
import { LeaveBalance } from '../types';
import { Sun, HeartPulse, Clock, Sparkles, AlertCircle } from 'lucide-react';

interface BalanceCardsProps {
  balances: LeaveBalance[];
  isLoading?: boolean;
}

export const BalanceCards: React.FC<BalanceCardsProps> = ({ balances, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800" />
        ))}
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        <AlertCircle className="w-8 h-8 mx-auto text-slate-500 mb-2" />
        <p className="text-sm font-medium">No leave balances allocated for {new Date().getFullYear()}.</p>
        <p className="text-xs text-slate-500 mt-1">Contact your HR department to initialize annual leave balances.</p>
      </div>
    );
  }

  const getCardTheme = (name?: string | null) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('annual') || lower.includes('vacation')) {
      return {
        icon: <Sun className="w-5 h-5 text-amber-400" />,
        gradient: 'from-amber-500/10 via-slate-900 to-slate-900',
        border: 'border-amber-500/20 hover:border-amber-500/40',
        bar: 'bg-amber-400',
        textAccent: 'text-amber-400',
      };
    }
    if (lower.includes('sick') || lower.includes('medical')) {
      return {
        icon: <HeartPulse className="w-5 h-5 text-rose-400" />,
        gradient: 'from-rose-500/10 via-slate-900 to-slate-900',
        border: 'border-rose-500/20 hover:border-rose-500/40',
        bar: 'bg-rose-400',
        textAccent: 'text-rose-400',
      };
    }
    return {
      icon: <Clock className="w-5 h-5 text-brand-400" />,
      gradient: 'from-brand-500/10 via-slate-900 to-slate-900',
      border: 'border-brand-500/20 hover:border-brand-500/40',
      bar: 'bg-brand-400',
      textAccent: 'text-brand-400',
    };
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {balances.map((b) => {
        const theme = getCardTheme(b.leave_type_name);
        const percentUsed = b.allocated_days > 0 ? Math.min(100, Math.round((b.used_days / b.allocated_days) * 100)) : 0;

        return (
          <div
            key={b.id}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-b ${theme.gradient} border ${theme.border} p-5 transition-all duration-300 hover:shadow-xl`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {b.year} Allocation
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                  {b.leave_type_name || 'Leave'}
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                {theme.icon}
              </div>
            </div>

            {/* Days metrics */}
            <div className="mt-5 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  {b.remaining_days}
                </span>
                <span className="text-xs text-slate-400 font-medium ml-1.5">days left</span>
              </div>
              <div className="text-right text-xs text-slate-400">
                <span className="font-semibold text-slate-300">{b.used_days}</span> used / <span className="font-semibold text-slate-300">{b.allocated_days}</span> total
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full ${theme.bar} transition-all duration-500 rounded-full`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5 font-medium">
                <span>{percentUsed}% utilized</span>
                <span>{b.remaining_days > 0 ? `${b.remaining_days} available` : 'Exhausted'}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
