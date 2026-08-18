import React from 'react';
import { ForecastResult } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot,
} from 'recharts';
import { Sparkles, BrainCircuit, Info, TrendingUp, AlertCircle } from 'lucide-react';

interface ForecastChartProps {
  forecast: ForecastResult;
  isLoading?: boolean;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ forecast, isLoading = false }) => {
  if (isLoading) {
    return <div className="h-80 bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800" />;
  }

  interface ChartItem {
    month: string;
    historical: number | null;
    predicted: number | null;
  }

  // Combine historical data with forecast point
  const chartData: ChartItem[] = (forecast.historical_data || []).map((d) => ({
    month: d.month,
    historical: d.count,
    predicted: null,
  }));

  if (forecast.predicted_month) {
    // If we have history, connect the last historical point to the predicted point
    const lastHist = chartData[chartData.length - 1];
    if (lastHist) {
      lastHist.predicted = lastHist.historical;
    }

    chartData.push({
      month: `${forecast.predicted_month} (Est.)`,
      historical: null,
      predicted: forecast.predicted_volume,
    });
  }

  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BrainCircuit className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-100">
              Predictive Leave Volume Forecast
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ML Model: {forecast.model_type.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Explainable regression model predicting upcoming staffing leave loads for proactive capacity planning.
          </p>
        </div>

        {/* Forecast Metric Callout */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Expected for {forecast.predicted_month}
            </div>
            <div className="text-2xl font-black text-emerald-400">
              ~{forecast.predicted_volume} <span className="text-xs font-normal text-slate-400">requests</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Line Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
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
            {/* Historical line */}
            <Line
              type="monotone"
              dataKey="historical"
              name="Historical Actual"
              stroke="#38bdf8"
              strokeWidth={3}
              dot={{ r: 4, fill: '#38bdf8' }}
            />
            {/* Predicted line (dashed) */}
            <Line
              type="monotone"
              dataKey="predicted"
              name="ML Forecast"
              stroke="#22c55e"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ r: 6, fill: '#22c55e', stroke: '#0f172a', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Model Explainability & Limitations Note */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" /> Explainable Linear Extrapolation
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Uses scikit-learn ordinary least squares regression over sequential monthly periods (X: month index, Y: request volume). The trend captures month-over-month trajectory for defensible staffing decisions.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
            <Info className="w-3.5 h-3.5 text-blue-400" /> Operational Context & Limitations
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            {forecast.confidence_note || 'Linear extrapolation assumes steady baseline growth. For seasonal holiday surges (e.g. December), combine with department staffing caps.'}
          </p>
        </div>
      </div>
    </div>
  );
};
