import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Bell,
  AlertTriangle,
  FileWarning,
  CheckCircle,
  Clock,
  ShieldAlert,
  Check
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/alerts');
      setAlerts(res.data.alerts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolveAlert = async (id: number) => {
    try {
      await api.patch(`/alerts/${id}`, { status: 'resolved' });
      fetchAlerts();
    } catch (err) {
      alert('Could not resolve alert.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Compliance Alerts & Telemetry Notifications
        </h1>
        <p className="text-sm text-slate-500">
          Real-time escalations, attendance variance warnings, and CCTV disconnect alerts.
        </p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-xs text-slate-400 py-12 text-center">Loading notifications...</p>
        ) : alerts.length === 0 ? (
          <p className="text-xs text-slate-400 py-12 text-center">All units operating within acceptable baseline compliance.</p>
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                a.status === 'resolved'
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : a.severity === 'critical'
                  ? 'bg-rose-50/60 border-rose-200'
                  : a.severity === 'high'
                  ? 'bg-orange-50/60 border-orange-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  a.severity === 'critical' ? 'bg-rose-100 text-rose-600' :
                  a.severity === 'high' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{a.title}</h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-700">
                      {a.alert_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{a.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                    <span>{a.project_name}</span>
                    <span>•</span>
                    <span>{a.project_state}</span>
                    <span>•</span>
                    <span>{a.created_at ? new Date(a.created_at).toLocaleString() : 'Recent'}</span>
                  </div>
                </div>
              </div>

              {a.status !== 'resolved' && (
                <button
                  onClick={() => handleResolveAlert(a.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Resolved</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
