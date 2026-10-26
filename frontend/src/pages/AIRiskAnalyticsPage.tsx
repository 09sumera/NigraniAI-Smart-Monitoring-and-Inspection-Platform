import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BrainCircuit,
  AlertTriangle,
  TrendingDown,
  ShieldAlert,
  Sparkles,
  CheckCircle,
  Building
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

export const AIRiskAnalyticsPage: React.FC = () => {
  const [riskData, setRiskData] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rRes, aRes] = await Promise.all([
          api.get('/analytics/risk'),
          api.get('/analytics/anomalies'),
        ]);
        const projectsList = rRes.data.projects || rRes.data.high_risk_projects || [];
        // Ensure project_name key exists
        const formatted = projectsList.map((p: any) => ({
          ...p,
          project_name: p.project_name || p.name || 'Monitored Unit',
          risk_score: typeof p.risk_score === 'number' ? Math.round(p.risk_score * 10) / 10 : 0
        }));
        setRiskData(formatted);
        setAnomalies(aRes.data.anomalies || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          AI Risk Scoring & Anomaly Detection
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
            Multi-Factor Risk Engine
          </span>
        </h1>
        <p className="text-sm text-slate-500">
          Continuous algorithmic surveillance across live attendance deficits, overdue inspection cycles, and open alerts.
        </p>
      </div>

      {/* Model Overview Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
            <BrainCircuit className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Deterministic Multi-Factor Vulnerability Scoring</h3>
            <p className="text-xs text-purple-200 mt-0.5">
              Live weights applied to compliance scores, statutory overdue days, open alerts, and attendance variance registers.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-purple-300">Model Framework</p>
            <p className="text-sm font-extrabold text-white">Heuristic Rules + Sandbox ML</p>
          </div>
        </div>
      </div>

      {/* Risk Distribution Chart */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
          Top Units Ranked by Machine-Computed Vulnerability Index
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskData.slice(0, 10)}>
              <XAxis dataKey="project_name" stroke="#94a3b8" fontSize={10} tickFormatter={(val) => (val ? String(val).slice(0, 14) + '...' : '')} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
              <Tooltip wrapperClassName="text-xs rounded-xl shadow-lg border border-slate-200" />
              <Bar dataKey="risk_score" fill="#ef4444" radius={[4, 4, 0, 0]} name="Risk Index (0-100)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detected Anomalies Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          Algorithmic Anomaly Flag Log ({anomalies.length} Flags)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 px-3">Project / State</th>
                <th className="pb-3 px-3">Vulnerability Score</th>
                <th className="pb-3 px-3">Triggering Factors & Weights</th>
                <th className="pb-3 px-3">Model Tag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {anomalies.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80">
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-900">{item.project_name}</p>
                    <p className="text-[10px] text-slate-400">{item.state}</p>
                  </td>
                  <td className="py-3 px-3 font-bold text-rose-600">
                    {item.risk_score} / 100
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(item.factors || []).map((f: any, fIdx: number) => (
                        <span key={fIdx} className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          {f.factor} (+{f.score} pts)
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[10px] text-indigo-600 font-semibold">
                    {item.detection_method}
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
