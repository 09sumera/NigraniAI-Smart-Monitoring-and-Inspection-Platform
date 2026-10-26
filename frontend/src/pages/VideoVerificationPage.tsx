import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  PhoneCall,
  Video,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  UserCheck,
  Building,
  Info,
  Radio,
  Clock
} from 'lucide-react';

export const VideoVerificationPage: React.FC = () => {
  const [inCall, setInCall] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        const list = res.data.projects || [];
        setProjects(list);
        if (list.length > 0) {
          setSelectedProjectId(String(list[0].id));
        }
      } catch (err) {
        console.error('Failed to fetch projects', err);
      }
    };
    fetchProjects();
  }, []);

  // Timer while in simulated call
  useEffect(() => {
    let timer: any;
    if (inCall) {
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [inCall]);

  const currentProject = projects.find((p) => String(p.id) === selectedProjectId) || projects[0];

  const formatSeconds = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Spot Video Verification Terminal
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Demonstration Simulator
            </span>
          </h1>
          <p className="text-sm text-slate-500">
            Simulated remote video audit interface for unannounced coordinator verification and premises check. Real database facility records; synthetic video transmission sandbox.
          </p>
        </div>
      </div>

      {/* Simulator Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-3 shadow-sm">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-950">Simulation Environment Disclosure</p>
          <p className="text-[11px] text-amber-800 mt-0.5">
            This module provides a prototype workflow demonstrating how field auditors conduct spot-check video interviews with project directors. No live RTSP/WebRTC hardware streams are opened.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-white shadow-xl max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[440px] relative overflow-hidden">
        {inCall ? (
          <div className="w-full flex flex-col items-center space-y-6">
            <div className="w-full aspect-video rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center animate-pulse">
                  <UserCheck className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-sm font-semibold text-white">
                  Coordinator: {currentProject?.project_manager || 'Designated Director'}
                </p>
                <p className="text-xs text-slate-400">
                  {currentProject?.name} • {currentProject?.district}, {currentProject?.state}
                </p>
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Call Active: {formatSeconds(callDuration)}</span>
                </div>
              </div>

              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-amber-400 flex items-center gap-1.5 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>SIMULATED AUDIT CALL SANDBOX</span>
              </div>
            </div>

            {/* In-Call Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMicMuted(!micMuted)}
                className={`p-3 rounded-full border transition-colors ${
                  micMuted ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setInCall(false)}
                className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Terminate Verification Call</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center max-w-md space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
              <PhoneCall className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Initiate Spot Video Audit</h2>
              <p className="text-xs text-slate-400 mt-1">
                Select an institution from the live database registry to establish an unannounced video inspection simulation.
              </p>
            </div>

            {/* Unit Selector */}
            <div className="text-left space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Target Registered Institution:</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.state}) — Mgr: {p.project_manager || 'Director'}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setInCall(true)}
              className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25 transition-all inline-flex items-center justify-center gap-2"
            >
              <Video className="w-4 h-4" />
              <span>Connect to Unit Coordinator</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
