import React, { useState, useEffect } from 'react';
import { LeaveType, LeaveBalance } from '../types';
import { leaveRequestApi } from '../api/client';
import { X, Calendar as CalendarIcon, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leaveTypes: LeaveType[];
  balances: LeaveBalance[];
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  leaveTypes,
  balances,
}) => {
  const [leaveTypeId, setLeaveTypeId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (leaveTypes.length > 0 && !leaveTypeId) {
        setLeaveTypeId(leaveTypes[0].id);
      }
      setErrorMessage(null);
    }
  }, [isOpen, leaveTypes]);

  if (!isOpen) return null;

  // Calculate working days (Mon-Fri) between start and end
  const calculateWorkingDays = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (end < start) return 0;

    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  const requestedWorkingDays = calculateWorkingDays(startDate, endDate);
  const currentBalance = balances.find((b) => b.leave_type_id === leaveTypeId);
  const isInsufficient = currentBalance && requestedWorkingDays > currentBalance.remaining_days;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!leaveTypeId) {
      setErrorMessage('Please select a leave category.');
      return;
    }
    if (!startDate || !endDate) {
      setErrorMessage('Please specify both start and end dates.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setErrorMessage('End date cannot be earlier than start date.');
      return;
    }
    if (requestedWorkingDays === 0) {
      setErrorMessage('Selected range does not contain any working days (Monday–Friday).');
      return;
    }

    setIsSubmitting(true);
    try {
      await leaveRequestApi.create({
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit leave request. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Submit Leave Request</h2>
              <p className="text-xs text-slate-400">Request time off with working-day balance calculation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Leave Type Select */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Leave Category
            </label>
            <select
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
            >
              {leaveTypes.map((lt) => {
                const bal = balances.find((b) => b.leave_type_id === lt.id);
                return (
                  <option key={lt.id} value={lt.id}>
                    {lt.name} ({bal ? `${bal.remaining_days} days left` : 'No balance recorded'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Working Days Calculation Preview */}
          {startDate && endDate && (
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              isInsufficient
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-slate-950/80 border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-brand-400" />
                <span>
                  Working Days (Mon–Fri): <strong>{requestedWorkingDays} days</strong>
                </span>
              </div>
              <div>
                {currentBalance && (
                  <span className={isInsufficient ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                    Available: {currentBalance.remaining_days} days
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Reason Textarea */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Reason / Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Annual family vacation, personal appointment..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isInsufficient}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-brand-500 to-emerald-400 hover:from-brand-400 hover:to-emerald-300 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
