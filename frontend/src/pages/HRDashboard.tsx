import React, { useState, useEffect } from 'react';
import { AnalyticsSummary, ForecastResult, Department, LeaveType } from '../types';
import { analyticsApi, departmentApi, leaveTypeApi } from '../api/client';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import { ForecastChart } from '../components/ForecastChart';
import {
  Shield,
  RefreshCw,
  Building2,
  Calendar,
  ExternalLink,
  BrainCircuit,
  FileText,
} from 'lucide-react';

export const HRDashboard: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchHRData = async () => {
    setIsLoading(true);
    try {
      const [sumData, fcData, deptData, ltData] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getForecast(),
        departmentApi.list(),
        leaveTypeApi.list(),
      ]);
      setSummary(sumData);
      setForecast(fcData);
      setDepartments(deptData);
      setLeaveTypes(ltData);
    } catch (err) {
      console.error('Failed to load HR analytics data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white">
              HR Administration & Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise-wide leave distribution analytics, department trends, and predictive volume modeling.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-brand-400" /> OpenAPI /docs <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={fetchHRData}
            title="Refresh Analytics"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Analytics Charts */}
      {summary && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Organization Leave Analytics
            </h2>
            <span className="text-[11px] text-slate-500">Real-time aggregate data</span>
          </div>
          <AnalyticsCharts summary={summary} isLoading={isLoading} />
        </section>
      )}

      {/* Predictive ML Forecasting Section */}
      {forecast && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-emerald-400" /> Machine Learning Forecast
            </h2>
            <span className="text-[11px] text-slate-500">Linear regression extrapolation</span>
          </div>
          <ForecastChart forecast={forecast} isLoading={isLoading} />
        </section>
      )}

      {/* Departments & Leave Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Departments List */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" /> Active Departments ({departments.length})
            </h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {departments.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
              >
                <span className="font-semibold text-slate-200">{d.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">{d.id.slice(0, 8)}...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Types Configuration */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-400" /> Configured Leave Policies ({leaveTypes.length})
            </h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {leaveTypes.map((lt) => (
              <div
                key={lt.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">{lt.name}</div>
                  <div className="text-[10px] text-slate-500">
                    {lt.is_paid ? 'Paid' : 'Unpaid'} • {lt.requires_approval ? 'Approval Required' : 'Auto-Approve'}
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 font-bold text-slate-300">
                  {lt.default_days_per_year} days/yr
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
