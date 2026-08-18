import React, { useState, useEffect } from 'react';
import { LeaveRequest } from '../types';
import { leaveRequestApi } from '../api/client';
import { TeamRequestsTable } from '../components/TeamRequestsTable';
import { Users, RefreshCw, CheckCircle2, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const [teamRequests, setTeamRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTeamData = async () => {
    setIsLoading(true);
    try {
      const data = await leaveRequestApi.getTeamRequests();
      setTeamRequests(data);
    } catch (err) {
      console.error('Failed to load team requests', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const pendingCount = teamRequests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = teamRequests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = teamRequests.filter((r) => r.status === 'REJECTED').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Manager Approval Hub
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review and approve leave requests for your direct reports with instant balance deductions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTeamData}
            title="Refresh Requests"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Pending Decisions
            </div>
            <div className="text-3xl font-black text-white mt-1">{pendingCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Awaiting your approval</div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Approved Leaves
            </div>
            <div className="text-3xl font-black text-white mt-1">{approvedCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Deducted from staff balance</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Team Requests
            </div>
            <div className="text-3xl font-black text-white mt-1">{teamRequests.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Across all direct reports</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Team Requests Table Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Direct Reports Leave Queue
          </h2>
          <span className="text-[11px] text-slate-500">Atomic balance sync on approval</span>
        </div>
        <TeamRequestsTable
          requests={teamRequests}
          isLoading={isLoading}
          onRefresh={fetchTeamData}
        />
      </section>
    </div>
  );
};
