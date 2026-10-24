import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { History, Shield, Clock } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.get('/audit-logs').then(res => setLogs(res.data.logs || [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          System Immutable Audit Logs
        </h1>
        <p className="text-sm text-slate-500">Security trail documenting every dispatch, login, and report modification.</p>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider font-sans">
              <th className="pb-3 px-3">Timestamp</th>
              <th className="pb-3 px-3">Actor</th>
              <th className="pb-3 px-3">Action Code</th>
              <th className="pb-3 px-3">Target Resource</th>
              <th className="pb-3 px-3">Details / IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[11px]">
            {logs.length === 0 ? (
              <tr><td colSpan={5} className="py-6 text-center text-slate-400 font-sans">Audit trail initialized. Actions will be logged here.</td></tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 text-slate-500">{new Date(l.created_at).toLocaleTimeString()}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900 font-sans">{l.user_name}</td>
                  <td className="py-3 px-3 font-bold text-blue-600">{l.action}</td>
                  <td className="py-3 px-3 text-slate-600">{l.resource_type} #{l.resource_id}</td>
                  <td className="py-3 px-3 text-slate-400 truncate max-w-xs">{l.details || l.ip_address}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
