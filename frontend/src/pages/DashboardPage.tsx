import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileWarning,
  CalendarX,
  Camera,
  ArrowUpRight,
  ShieldAlert,
  TrendingUp,
  MapPin
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, trendRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/trends'),
        ]);
        setSummary(sumRes.data);
        setTrends(trendRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Aggregating real-time telemetry...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    { title: 'Total Registered Projects', value: summary?.total_projects || 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
    { title: 'Active Institutions', value: summary?.active_institutions || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    { title: 'Inspections Completed', value: summary?.inspections_this_month || 0, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
    { title: 'Pending Inspections', value: summary?.pending_inspections || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
    { title: 'High/Critical Risk Units', value: summary?.high_risk_projects || 0, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
    { title: 'Open Compliance Violations', value: summary?.open_violations || 0, icon: FileWarning, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
    { title: 'Overdue Inspections', value: summary?.overdue_inspections || 0, icon: CalendarX, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
    { title: 'Evidence Awaiting Verification', value: summary?.evidence_awaiting_verification || 0, icon: Camera, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-100' },
  ];

  const RISK_COLORS: Record<string, string> = {
    low: '#10b981',
    moderate: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">National Monitoring Command Center</h1>
          <p className="text-sm text-slate-500">Real-time status of DoSJE assisted institutions and surveillance activities</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync Active
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border ${kpi.bg} transition-all hover:shadow-md`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{kpi.title}</span>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inspection Trends Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">6-Month Inspection Volume Trends</h2>
            <span className="text-xs text-slate-400">Completed vs Pending Assignments</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends?.inspection_trend || []}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip wrapperClassName="text-xs rounded-xl shadow-lg border border-slate-200" />
                <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Pie */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Risk Portfolio</h2>
            <span className="text-xs text-slate-400">Project Risk Classification</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trends?.risk_distribution || []}
                  dataKey="count"
                  nameKey="level"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {(trends?.risk_distribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.level] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip wrapperClassName="text-xs rounded-xl shadow-lg border border-slate-200" />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Alerts and High Risk Projects Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Alerts */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Priority Compliance Alerts
            </h2>
            <span className="text-xs text-rose-600 font-semibold">Immediate Action Required</span>
          </div>

          <div className="space-y-3">
            {(trends?.critical_alerts || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No critical alerts currently triggered.</p>
            ) : (
              (trends?.critical_alerts || []).map((alert: any) => (
                <div key={alert.id} className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-800 truncate">{alert.title}</span>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-200/60 text-rose-900">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{alert.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                      <span>{alert.project_name}</span>
                      <span>•</span>
                      <span>{alert.project_state}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* High Risk Projects */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Units Requiring Surprise Audit
            </h2>
            <span className="text-xs text-slate-400">High Risk Index</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-2.5">Project</th>
                  <th className="pb-2.5">State</th>
                  <th className="pb-2.5">Risk Score</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(trends?.high_risk_projects || []).map((proj: any) => (
                  <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 font-medium text-slate-800 truncate max-w-[160px]">{proj.name}</td>
                    <td className="py-2.5 text-slate-500">{proj.state}</td>
                    <td className="py-2.5 font-bold text-rose-600">{proj.risk_score}</td>
                    <td className="py-2.5 text-right">
                      <a
                        href="/surprise-inspections"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Inspect <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
