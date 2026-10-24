import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Camera } from '../types';
import { Video, Wifi, WifiOff, Eye, RefreshCw, ShieldCheck } from 'lucide-react';

export const CCTVPage: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCam, setSelectedCam] = useState<Camera | null>(null);

  const fetchCameras = async () => {
    setLoading(true);
    try {
      const res = await api.get('/monitoring/cameras');
      setCameras(res.data.cameras || []);
      if (res.data.cameras?.length > 0 && !selectedCam) {
        setSelectedCam(res.data.cameras[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Centralized CCTV Surveillance Grid
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Live Gateway Integration
            </span>
          </h1>
          <p className="text-sm text-slate-500">
            Real-time visual telemetry, perimeter feeds, and dormitory monitoring for assisted institutions.
          </p>
        </div>
        <button
          onClick={fetchCameras}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Feeds</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed Viewport */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl aspect-video relative flex items-center justify-center">
            {selectedCam ? (
              <div className="w-full h-full relative flex items-center justify-center bg-slate-900">
                {/* Simulated CCTV Visual overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/40 via-slate-950 to-slate-950 flex flex-col justify-between p-6 pointer-events-none">
                  <div className="flex justify-between items-start text-xs font-mono text-emerald-400">
                    <div className="flex items-center gap-2 bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-md">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>LIVE // {selectedCam.name}</span>
                    </div>
                    <span className="bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-md">
                      FPS: 29.97 • REC [ON]
                    </span>
                  </div>

                  <div className="flex justify-center">
                    <div className="px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-center">
                      <p className="text-sm font-semibold text-white">{selectedCam.project_name}</p>
                      <p className="text-xs text-slate-400">{selectedCam.location_desc} • Authorized MoSJE Surveillance Node</p>
                    </div>
                  </div>

                  <div className="flex justify-between text-[11px] font-mono text-slate-400 bg-black/60 px-3 py-1.5 rounded-md backdrop-blur-md">
                    <span>STATUS: {selectedCam.status.toUpperCase()}</span>
                    <span>TIMESTAMP: {new Date().toISOString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Select a camera to establish secure RTSP/WebRTC stream.</p>
            )}
          </div>

          {selectedCam && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedCam.name}</h3>
                <p className="text-xs text-slate-500">{selectedCam.project_name} — {selectedCam.location_desc}</p>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Feed Healthy
              </span>
            </div>
          )}
        </div>

        {/* Camera List Sidebar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col h-[520px]">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Active Camera Grid ({cameras.length})
          </h2>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <p className="text-xs text-slate-400 py-6 text-center">Discovering endpoints...</p>
            ) : (
              cameras.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCam(c)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedCam?.id === c.id
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-800 truncate">{c.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{c.project_name}</p>
                    <span className="text-[10px] text-slate-400">{c.location_desc}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    c.status === 'connected' ? 'bg-emerald-500' :
                    c.status === 'simulated' ? 'bg-blue-500' : 'bg-rose-500'
                  }`} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
