import React, { useState } from 'react';
import { LeaveRequest, LeaveStatus } from '../types';
import { leaveRequestApi } from '../api/client';
import {
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

interface TeamRequestsTableProps {
  requests: LeaveRequest[];
  isLoading?: boolean;
  onRefresh: () => void;
}

export const TeamRequestsTable: React.FC<TeamRequestsTableProps> = ({
  requests,
  isLoading = false,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'DECIDED'>('PENDING');
  const [activeDecision, setActiveDecision] = useState<{
    request: LeaveRequest;
    action: 'approve' | 'reject';
  } | null>(null);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredRequests = requests.filter((r) => {
    if (filter === 'PENDING') return r.status === 'PENDING';
    if (filter === 'DECIDED') return r.status === 'APPROVED' || r.status === 'REJECTED';
    return true;
  });

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDecision) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await leaveRequestApi.decide(activeDecision.request.id, {
        action: activeDecision.action,
        comment: comment.trim(),
      });
      setActiveDecision(null);
      setComment('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to record decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadges: Record<LeaveStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    PENDING: {
      label: 'Needs Review',
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
      label: 'Cancelled by Staff',
      bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
      text: 'text-slate-400',
      icon: <X className="w-3.5 h-3.5" />,
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

  return (
    <div className="space-y-4">
      {/* Filter Tabs & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 w-fit">
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'PENDING'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending Review ({requests.filter((r) => r.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'ALL'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Requests ({requests.length})
          </button>
          <button
            onClick={() => setFilter('DECIDED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'DECIDED'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Decided ({requests.filter((r) => r.status === 'APPROVED' || r.status === 'REJECTED').length})
          </button>
        </div>
      </div>

      {/* Table */}
      {filteredRequests.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center">
          <Users className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">No Requests to Display</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {filter === 'PENDING'
              ? 'All caught up! No pending leave requests require your review.'
              : 'No leave request records found in this view.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Dates</th>
                <th className="px-5 py-3.5">Working Days</th>
                <th className="px-5 py-3.5">Reason</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredRequests.map((r) => {
                const badge = statusBadges[r.status] || statusBadges.PENDING;
                const isPending = r.status === 'PENDING';

                return (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-brand-400">
                          {(r.user_name || 'U').charAt(0)}
                        </div>
                        <span>{r.user_name || 'Team Member'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300 font-medium">
                      {r.leave_type_name || 'Leave'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-200">
                        {r.start_date} → {r.end_date}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Applied {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold text-white">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                        {r.days_requested} {r.days_requested === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      {r.reason ? (
                        <div className="text-slate-300 line-clamp-2">{r.reason}</div>
                      ) : (
                        <span className="text-slate-500 italic">No notes</span>
                      )}
                      {r.decision_comment && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          <MessageSquare className="w-3 h-3 text-slate-500 flex-shrink-0" />
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setActiveDecision({ request: r, action: 'approve' });
                              setComment('');
                              setErrorMsg(null);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center gap-1 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => {
                              setActiveDecision({ request: r, action: 'reject' });
                              setComment('');
                              setErrorMsg(null);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">
                          Decided by {r.approver_name || 'Manager'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Decision Modal */}
      {activeDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              {activeDecision.action === 'approve' ? (
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              ) : (
                <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="w-4 h-4" />
                </span>
              )}
              {activeDecision.action === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {activeDecision.request.user_name} • {activeDecision.request.days_requested} working days (
              {activeDecision.request.start_date} to {activeDecision.request.end_date})
            </p>

            {errorMsg && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleDecisionSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Manager Feedback / Comment (Optional)
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    activeDecision.action === 'approve'
                      ? 'e.g. Approved, enjoy your break! Handover confirmed.'
                      : 'e.g. Please reschedule due to ongoing release sprint.'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveDecision(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                    activeDecision.action === 'approve'
                      ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                      : 'bg-rose-500 hover:bg-rose-400 text-white'
                  }`}
                >
                  {isSubmitting
                    ? 'Processing...'
                    : activeDecision.action === 'approve'
                    ? 'Confirm Approval'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
