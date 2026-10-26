import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  FileText,
  Download,
  CheckCircle,
  Filter,
  Search,
  ExternalLink
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports');
        setReports(res.data.reports || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExportCSV = () => {
    window.open('/api/reports/export/csv', '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Inspection Audit Reports
          </h1>
          <p className="text-sm text-slate-500">
            Official completed inspection proceedings, compliance evaluations, and statutory summaries.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Dossier</span>
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 px-3">Report ID / Unit</th>
                <th className="pb-3 px-3">State</th>
                <th className="pb-3 px-3">Auditing Officer</th>
                <th className="pb-3 px-3">Protocol Type</th>
                <th className="pb-3 px-3">Assessed Score</th>
                <th className="pb-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading audit dossiers...</td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No completed inspection reports logged yet.</td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{r.project_name}</p>
                      <span className="text-[10px] font-mono text-slate-400">{r.inspection_id}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{r.project_state}</td>
                    <td className="py-3 px-3 text-slate-600">{r.assigned_officer || 'Designated Auditor'}</td>
                    <td className="py-3 px-3 uppercase text-[10px] font-semibold text-blue-600">{r.inspection_type}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {r.score !== null && r.score !== undefined ? `${r.score} / 100` : 'Pending Assessment'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
