import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Users2,
  Calendar,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  UserX
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

export const AttendanceAnalyticsPage: React.FC = () => {
  const [trend, setTrend] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [anomalyRate, setAnomalyRate] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/attendance');
      setTrend(res.data.trend || []);
      setAnomalies(res.data.anomalous_records || []);
      setTotalRecords(res.data.total_records || 0);
      setAnomalyRate(res.data.anomaly_rate || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Staff & Beneficiary Attendance Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Cross-verification of reported attendance registers against sanctioned rosters and historical trends.
          </p>
        </div>
        <button
          onClick={fetchAttendance}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* KPI Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Monitored Records</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalRecords}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Discrepancy Incidents</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{anomalies.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Systemic Anomaly Rate</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{anomalyRate}%</p>
        </div>
      </div>

      {/* Attendance Trend Chart */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
          Expected vs Reported Attendance Aggregates
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend.slice(-14)}>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip wrapperClassName="text-xs rounded-xl shadow-lg border border-slate-200" />
              <Bar dataKey="expected" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Expected Roster" />
              <Bar dataKey="reported" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Reported Present" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Discrepancy Log Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <UserX className="w-4 h-4 text-rose-500" />
          Flagged Variance Registry
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3">Project</th>
                <th className="pb-3 px-3">Expected Staff</th>
                <th className="pb-3 px-3">Reported Present</th>
                <th className="pb-3 px-3">Discrepancy Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {anomalies.map((a, i) => (
                <tr key={i} className="hover:bg-slate-50/80">
                  <td className="py-3 px-3 font-mono text-slate-600">{a.record_date}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{a.project_name || 'Assisted Unit'}</td>
                  <td className="py-3 px-3 text-slate-600">{a.expected_staff}</td>
                  <td className="py-3 px-3 text-slate-600">{a.reported_present}</td>
                  <td className="py-3 px-3 font-bold text-rose-600">
                    -{a.discrepancy} staff gap
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
