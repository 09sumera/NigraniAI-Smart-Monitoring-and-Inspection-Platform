import React, { useState } from 'react';
import api from '../services/api';
import {
  Sparkles,
  ShieldAlert,
  Dice5,
  ArrowRight,
  CheckCircle2,
  Calendar,
  UserCheck,
  Building,
  Info
} from 'lucide-react';

export const SurpriseInspectionsPage: React.FC = () => {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleGenerateSurprise = async () => {
    setGenerating(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/assignments/generate', { simulation_mode: true });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to dispatch surprise inspection.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Automated Surprise Inspection Engine
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
            Weighted Multi-Factor AI
          </span>
        </h1>
        <p className="text-sm text-slate-500">
          Unbiased, algorithm-driven inspection dispatcher combining risk metrics, audit gaps, and non-predictable randomization.
        </p>
      </div>

      {/* Main Action Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-indigo-200 mb-4 border border-white/10">
            <Dice5 className="w-4 h-4 text-amber-400" />
            Zero-Collusion Anti-Tamper Protocol
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Trigger Algorithmic Surprise Inspection
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Evaluates 30+ registered units across state territories. Factors include historical non-compliance, attendance anomalies, CCTV blackout events, and overdue audit schedules.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              onClick={handleGenerateSurprise}
              disabled={generating}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Computing Risk Weights...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Surprise Inspection</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-slate-400">
              Simulation Sandbox Active • No real-world notice sent
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Generated Result Card */}
      {result && (
        <div className="p-6 rounded-3xl bg-white border border-emerald-200 shadow-lg shadow-emerald-500/5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Surprise Inspection Dispatched Successfully</span>
            </div>
            <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
              ID: {result.inspection_id || result.assignment?.inspection_id || 'INS-ACTIVE'}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" /> Target Unit
              </span>
              <p className="mt-1 font-bold text-slate-900 text-sm">{result.assignment?.project_name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{result.assignment?.project_state}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> Assigned Inspector
              </span>
              <p className="mt-1 font-bold text-slate-900 text-sm">{result.assignment?.officer_name || 'Designated Field Officer'}</p>
              <p className="text-xs text-slate-500 mt-0.5">Dispatched to Mobile Workspace</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Risk Score at Trigger
              </span>
              <p className="mt-1 font-bold text-rose-600 text-sm">
                {result.assignment?.risk_score_at_assignment || 78.5} / 100
              </p>
              <p className="text-xs text-slate-500 mt-0.5">High Priority Queue</p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs">
            <span className="font-bold text-indigo-900">Selection Justification:</span>
            <p className="text-indigo-800 mt-1 leading-relaxed">
              {result.selection_reason || result.assignment?.assignment_reason || 'Multi-factor model identified high variance between reported beneficiary census and staff attendance metrics.'}
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <a
              href="/mobile-workspace"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
            >
              Open in Inspector Mobile Workspace <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Rules and Explanation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">1. Risk Weighting (70%)</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Prioritizes entities with historical violations, low compliance index, and prolonged gaps between verified on-site visits.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">2. Unpredictable Randomizer (30%)</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Introduces non-deterministic sampling across all units to prevent low-risk institutions from anticipating inspection intervals.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">3. Rotation Enforcement</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Dynamically excludes inspectors who conducted audits at the chosen institute within the last 180 days to eliminate familiarity bias.
          </p>
        </div>
      </div>
    </div>
  );
};
