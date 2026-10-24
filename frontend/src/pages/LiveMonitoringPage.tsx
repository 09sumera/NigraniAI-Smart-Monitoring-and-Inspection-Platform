import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Activity,
  MapPin,
  Camera,
  ShieldCheck,
  Building,
  RefreshCw
} from 'lucide-react';

export const LiveMonitoringPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [totalActive, setTotalActive] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLiveStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/monitoring/status');
      setProjects(res.data.projects || []);
      setTotalActive(res.data.total_active || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Real-Time Command Map & Field Telemetry
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {totalActive} Active Units
            </span>
          </h1>
          <p className="text-sm text-slate-500">
            Interactive geographical distribution and heartbeat monitoring of nationwide centers.
          </p>
        </div>
        <button
          onClick={fetchLiveStatus}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Grid of Monitored Project Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-xs text-slate-400 py-12 col-span-3 text-center">Contacting field telemetry servers...</p>
        ) : (
          projects.map((p) => (
            <div key={p.id} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">{p.project_id}</span>
                <span className={`w-2 h-2 rounded-full ${
                  p.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm truncate">{p.name}</h3>
                <p className="text-xs text-slate-500">{p.state}, {p.district}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400">Risk Score:</span>
                  <p className="font-bold text-rose-600">{p.risk_score} / 100</p>
                </div>
                <div>
                  <span className="text-slate-400">Cameras:</span>
                  <p className="font-bold text-slate-700">{p.camera_count || 1} Deployed</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
