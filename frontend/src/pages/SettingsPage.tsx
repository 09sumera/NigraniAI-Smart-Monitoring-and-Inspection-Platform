import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Settings, Save, Shield, Sliders, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [riskWeight, setRiskWeight] = useState(70);
  const [randomWeight, setRandomWeight] = useState(30);
  const [overdueWeight, setOverdueWeight] = useState(25);
  const [complianceWeight, setComplianceWeight] = useState(20);
  const [alertWeight, setAlertWeight] = useState(15);
  const [attendanceWeight, setAttendanceWeight] = useState(15);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      if (res.data) {
        setRiskWeight(res.data.risk_weight ?? 70);
        setRandomWeight(res.data.random_weight ?? 30);
        setOverdueWeight(res.data.overdue_weight ?? 25);
        setComplianceWeight(res.data.compliance_weight ?? 20);
        setAlertWeight(res.data.alert_weight ?? 15);
        setAttendanceWeight(res.data.attendance_weight ?? 15);
      }
    } catch (err: any) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await api.post('/settings', {
        risk_weight: riskWeight,
        random_weight: randomWeight,
        overdue_weight: overdueWeight,
        compliance_weight: complianceWeight,
        alert_weight: alertWeight,
        attendance_weight: attendanceWeight,
      });
      setSuccessMsg('Hyperparameters persisted to database. Surprise inspection engine updated.');
      if (res.data) {
        setRiskWeight(res.data.risk_weight);
        setRandomWeight(res.data.random_weight);
      }
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to save hyperparameters to database.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          System Configuration & AI Model Hyperparameters
        </h1>
        <p className="text-sm text-slate-500">
          Configure surprise dispatch selection weights, compliance penalty factors, and audit randomization thresholds.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2.5 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-6 text-xs">
        {loading ? (
          <p className="text-slate-400 py-8 text-center">Loading system configuration...</p>
        ) : (
          <>
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Surprise Engine Candidate Weight Balancing</span>
              </h2>
              <p className="text-slate-500">
                Governs the probabilistic candidate selection in <code className="text-indigo-600">InspectionEngine</code>. Higher risk influence prioritizes high-vulnerability facilities; higher randomization guarantees non-predictable routine audits.
              </p>

              <div className="mt-5 space-y-5">
                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1.5">
                    <span>Deterministic Risk Factor Influence</span>
                    <span className="font-mono text-blue-600">{riskWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="90"
                    value={riskWeight}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRiskWeight(val);
                      setRandomWeight(100 - val);
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-[10px] text-slate-400">Scale factor applied to the facility's composite risk vulnerability score.</span>
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1.5">
                    <span>Non-Predictable Randomization Factor</span>
                    <span className="font-mono text-indigo-600">{randomWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="70"
                    value={randomWeight}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRandomWeight(val);
                      setRiskWeight(100 - val);
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400">Uniform baseline probability preventing audit predictability.</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Multi-Factor Vulnerability Scoring Sub-Weights
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500">Overdue Audit Weight</span>
                  <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">{overdueWeight}%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500">Compliance Deficit Weight</span>
                  <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">{complianceWeight}%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500">Open Alerts Weight</span>
                  <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">{alertWeight}%</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500">Attendance Variance Weight</span>
                  <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">{attendanceWeight}%</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Persists to SQLite <code className="text-slate-600">system_settings</code> table</span>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Persisting...' : 'Persist Hyperparameters'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
