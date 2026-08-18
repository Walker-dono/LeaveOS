import React, { useState } from 'react';
import { LeaveRequest, LeaveStatus } from '../types';
import { leaveRequestApi } from '../api/client';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Calendar,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

interface RequestHistoryTableProps {
  requests: LeaveRequest[];
  isLoading?: boolean;
  onRefresh: () => void;
}

export const RequestHistoryTable: React.FC<RequestHistoryTableProps> = ({
  requests,
  isLoading = false,
  onRefresh,
}) => {
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this pending leave request?')) {
      return;
    }
    setCancellingId(id);
    try {
      await leaveRequestApi.cancel(id);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel request.');
    } finally {
      setCancellingId(null);
    }
  };

  const statusBadges: Record<LeaveStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    PENDING: {
      label: 'Pending Review',
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      text: 'text-amber-400',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    APPROVED: {
      label: 'Approved',
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      text: 'text-emerald-400',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    REJECTED: {
      label: 'Rejected',
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      text: 'text-rose-400',
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
      text: 'text-slate-400',
      icon: <Ban className="w-3.5 h-3.5" />,
    },
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-slate-900/60 rounded-xl animate-pulse border border-slate-800" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center">
        <Calendar className="w-10 h-10 mx-auto text-slate-600 mb-3" />
        <h4 className="text-sm font-semibold text-slate-300">No Leave Requests Found</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          You haven't submitted any leave requests yet. Click "New Request" above to book your time off.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
          <tr>
            <th className="px-5 py-3.5">Category</th>
            <th className="px-5 py-3.5">Date Range</th>
            <th className="px-5 py-3.5">Working Days</th>
            <th className="px-5 py-3.5">Reason & Feedback</th>
            <th className="px-5 py-3.5">Status</th>
            <th className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-300">
          {requests.map((r) => {
            const badge = statusBadges[r.status] || statusBadges.PENDING;
            const isPending = r.status === 'PENDING';

            return (
              <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-4 font-semibold text-slate-200">
                  {r.leave_type_name || 'General Leave'}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 font-medium text-slate-200">
                    <span>{r.start_date}</span>
                    <span className="text-slate-500">→</span>
                    <span>{r.end_date}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Requested on {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-5 py-4 font-bold text-white">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                    {r.days_requested} {r.days_requested === 1 ? 'day' : 'days'}
                  </span>
                </td>
                <td className="px-5 py-4 max-w-xs">
                  {r.reason ? (
                    <div className="text-slate-300 line-clamp-1">{r.reason}</div>
                  ) : (
                    <span className="text-slate-500 italic">No notes provided</span>
                  )}
                  {r.decision_comment && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-300/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <MessageSquare className="w-3 h-3 flex-shrink-0" />
                      <span className="line-clamp-1">{r.decision_comment}</span>
                    </div>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
                  >
                    {badge.icon}
                    {badge.label}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  {isPending ? (
                    <button
                      onClick={() => handleCancel(r.id)}
                      disabled={cancellingId === r.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-colors disabled:opacity-50"
                    >
                      {cancellingId === r.id ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
