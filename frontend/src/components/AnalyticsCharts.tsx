import React from 'react';
import { AnalyticsSummary } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  CheckCircle,
  Building2,
  Calendar,
  Layers,
  PieChart as PieIcon,
} from 'lucide-react';

interface AnalyticsChartsProps {
  summary: AnalyticsSummary;
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  APPROVED: '#22c55e', // Emerald
  PENDING: '#f59e0b',  // Amber
  REJECTED: '#f43f5e', // Rose
  CANCELLED: '#64748b',// Slate
};

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ summary, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800" />
        ))}
      </div>
    );
  }

  // Calculate high-level KPIs
  const total = summary.total_requests || 0;
  const approvedCount = summary.by_status.find((s) => s.status === 'APPROVED')?.count || 0;
  const approvalRate = total > 0 ? Math.round((approvedCount / total) * 100) : 0;
  const pendingCount = summary.by_status.find((s) => s.status === 'PENDING')?.count || 0;

  const pieData = summary.by_status.map((s) => ({
    name: s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || '#94a3b8',
  }));

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Requests</span>
            <Layers className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{total}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all departments</div>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Approval Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">{approvalRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{approvedCount} approved requests</div>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Pending Review</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">{pendingCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting manager action</div>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Depts</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 mt-2">
            {summary.by_department.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Reporting staff leave</div>
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-400" /> Monthly Leave Request Volume
              </h3>
              <p className="text-xs text-slate-400">Historical trend across past months</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.by_month} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="leaveTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Requests"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#leaveTrend)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Requests by Department Bar Chart */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" /> Requests by Department
              </h3>
              <p className="text-xs text-slate-400">Leave distribution across organizational units</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.by_department} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="department" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="count" name="Total Requests" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-amber-400" /> Request Status Breakdown
              </h3>
              <p className="text-xs text-slate-400">Proportions of approved, pending, and rejected leaves</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="h-56 md:col-span-2 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Status Legend */}
            <div className="space-y-3">
              {pieData.map((item) => {
                const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-200">{item.name}</span>
                    </div>
                    <div className="font-bold text-white">
                      {item.value} <span className="text-[10px] text-slate-500 font-normal">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
