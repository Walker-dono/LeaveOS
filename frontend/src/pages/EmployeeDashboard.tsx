import React, { useState, useEffect } from 'react';
import { LeaveBalance, LeaveRequest, LeaveType } from '../types';
import { leaveBalanceApi, leaveRequestApi, leaveTypeApi } from '../api/client';
import { BalanceCards } from '../components/BalanceCards';
import { RequestHistoryTable } from '../components/RequestHistoryTable';
import { NewRequestModal } from '../components/NewRequestModal';
import { Plus, RefreshCw, Briefcase, CalendarCheck } from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [balData, reqData, typesData] = await Promise.all([
        leaveBalanceApi.getMyBalances(),
        leaveRequestApi.getMyRequests(),
        leaveTypeApi.list(),
      ]);
      setBalances(balData);
      setRequests(reqData);
      setLeaveTypes(typesData);
    } catch (err) {
      console.error('Failed to load employee data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header with Title and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Briefcase className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Employee Portal
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track your available annual leave balances and submit time-off requests.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            title="Refresh Data"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-brand-500 to-emerald-400 hover:from-brand-400 hover:to-emerald-300 transition-all shadow-lg shadow-brand-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Book Time Off
          </button>
        </div>
      </div>

      {/* Leave Balances Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Current Leave Balances ({new Date().getFullYear()})
          </h2>
          <span className="text-[11px] text-slate-500">Working days only (Mon–Fri)</span>
        </div>
        <BalanceCards balances={balances} isLoading={isLoading} />
      </section>

      {/* Request History Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CalendarCheck className="w-3.5 h-3.5 text-brand-400" /> Leave Request History
          </h2>
          <span className="text-[11px] text-slate-500">
            {requests.length} {requests.length === 1 ? 'record' : 'records'} total
          </span>
        </div>
        <RequestHistoryTable requests={requests} isLoading={isLoading} onRefresh={fetchData} />
      </section>

      {/* New Request Modal */}
      <NewRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        leaveTypes={leaveTypes}
        balances={balances}
      />
    </div>
  );
};
