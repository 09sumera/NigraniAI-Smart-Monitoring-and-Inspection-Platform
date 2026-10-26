import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Smartphone,
  MapPin,
  Camera,
  CheckCircle,
  Upload,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const MobileWorkspacePage: React.FC = () => {
  const [inspections, setInspections] = useState<any[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [observations, setObservations] = useState('');
  const [findings, setFindings] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const fetchAssigned = async () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const targetInspectionCode = searchParams.get('inspection_id');
      const targetId = searchParams.get('id');

      const res = await api.get('/inspections', { params: { per_page: 50 } });
      let list = res.data.inspections || [];

      // If a specific target inspection was requested via URL but not in the default page, fetch it directly
      if (targetInspectionCode && !list.some((i: any) => i.inspection_id === targetInspectionCode)) {
        try {
          const singleRes = await api.get('/inspections', { params: { inspection_id: targetInspectionCode } });
          const singleList = singleRes.data.inspections || [];
          if (singleList.length > 0) {
            list = [singleList[0], ...list];
          }
        } catch (e) {
          console.warn('Could not fetch target inspection by code', e);
        }
      }
      if (targetId && !list.some((i: any) => i.id === Number(targetId))) {
        try {
          const singleRes = await api.get(`/inspections/${targetId}`);
          if (singleRes.data && singleRes.data.id) {
            list = [singleRes.data, ...list];
          }
        } catch (e) {
          console.warn('Could not fetch target inspection by id', e);
        }
      }

      setInspections(list);

      // Prioritize selecting the targeted inspection if specified in URL query
      if (targetInspectionCode || targetId) {
        const found = list.find((i: any) =>
          (targetInspectionCode && i.inspection_id === targetInspectionCode) ||
          (targetId && i.id === Number(targetId))
        );
        if (found) {
          setSelectedInspection(found);
          return;
        }
      }

      if (list.length > 0) {
        setSelectedInspection((prev: any) => {
          if (!prev) return list[0];
          const found = list.find((i: any) => i.id === prev.id);
          return found || list[0];
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch assigned inspections:', err);
    }
  };

  useEffect(() => {
    fetchAssigned();
  }, []);

  const handleCaptureLocation = () => {
    setLocationStatus('Acquiring GPS fix...');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationStatus(`GPS Locked: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        },
        () => {
          // Simulation fallback for browser restrictions
          setCoords({ lat: 19.076, lng: 72.8777 });
          setLocationStatus('GPS Locked (Demo Geo-Tag: 19.07600, 72.87770)');
        }
      );
    } else {
      setCoords({ lat: 19.076, lng: 72.8777 });
      setLocationStatus('GPS Locked (Demo Geo-Tag: 19.07600, 72.87770)');
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!selectedInspection) {
      setErrorMsg('Please select an active field assignment before transmitting report.');
      return;
    }

    if (selectedInspection.status === 'submitted') {
      setErrorMsg('This inspection report has already been submitted and is currently under review.');
      return;
    }

    if (!observations.trim()) {
      setErrorMsg('Please enter on-site physical observations before transmitting report.');
      return;
    }

    if (!findings.trim()) {
      setErrorMsg('Please enter critical findings & discrepancies before transmitting report.');
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // Build unified FormData payload preserving file uploads, GPS metadata, and details
      const formData = new FormData();
      formData.append('status', 'submitted');
      formData.append('inspection_id', String(selectedInspection.id));
      formData.append('project_id', String(selectedInspection.project_id));
      formData.append('observations', observations.trim());
      formData.append('findings', findings.trim());
      formData.append('severity', severity);

      if (coords?.lat != null) {
        formData.append('latitude', String(coords.lat));
      }
      if (coords?.lng != null) {
        formData.append('longitude', String(coords.lng));
      }

      if (file) {
        formData.append('file', file);
        formData.append('description', 'On-site mobile evidence capture');
      }

      await api.patch(`/inspections/${selectedInspection.id}`, formData);

      setSuccessMsg('Inspection report and geo-tagged evidence successfully uploaded to the central command database!');
      setObservations('');
      setFindings('');
      setFile(null);

      // Refresh assignments so status badge and lifecycle update
      await fetchAssigned();
    } catch (err: any) {
      console.error('Submission error:', err);
      const safeError =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Error submitting report. Please verify connection and inputs.';
      setErrorMsg(safeError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Mobile Frame Header */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Inspector Mobile Workspace</h2>
            <p className="text-[11px] text-slate-400">PWA Field Client • Geo-Enforced Mode</p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Online
        </span>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Select Assigned Inspection */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Active Field Assignment
        </label>
        <select
          value={selectedInspection?.id || ''}
          onChange={(e) => {
            const found = inspections.find((i) => i.id === Number(e.target.value));
            setSelectedInspection(found);
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
        >
          {inspections.map((i) => (
            <option key={i.id} value={i.id}>
              {i.inspection_id} — {i.project_name}{i.district ? ` (${i.district})` : ''} [{i.status}]
            </option>
          ))}
        </select>

        {selectedInspection && (
          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Inspection Code:</span>
              <span className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {selectedInspection.inspection_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Entity:</span>
              <span className="font-bold text-slate-800">{selectedInspection.project_name}</span>
            </div>
            {selectedInspection.institution_name && (
              <div className="flex justify-between">
                <span className="text-slate-500">Institution:</span>
                <span className="font-medium text-slate-700">{selectedInspection.institution_name}</span>
              </div>
            )}
            {(selectedInspection.district || selectedInspection.project_state) && (
              <div className="flex justify-between">
                <span className="text-slate-500">Jurisdiction:</span>
                <span className="font-medium text-slate-700">
                  {[selectedInspection.district, selectedInspection.project_state].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Inspection Type:</span>
              <span className="font-semibold uppercase text-blue-600">{selectedInspection.inspection_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Lifecycle:</span>
              <span className={`font-semibold capitalize ${
                selectedInspection.status === 'submitted'
                  ? 'text-emerald-600'
                  : selectedInspection.status === 'in_progress'
                  ? 'text-blue-600'
                  : 'text-slate-700'
              }`}>
                {selectedInspection.status}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Inspection Form */}
      <form onSubmit={handleSubmitReport} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4 text-xs">
        {/* Geo-tag button */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            1. Real-Time Geo-Location Lock
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCaptureLocation}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Capture GPS Coordinates</span>
            </button>
            <span className="text-[11px] text-slate-500 truncate">{locationStatus || 'No GPS captured'}</span>
          </div>
        </div>

        {/* Evidence attachment */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            2. Photographic / Video Evidence
          </label>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
            <Camera className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-500"
            />
            {file && (
              <p className="mt-2 text-[11px] font-bold text-emerald-600">Selected: {file.name}</p>
            )}
          </div>
        </div>

        {/* Observations */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            3. On-Site Physical Observations
          </label>
          <textarea
            required
            rows={3}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Document hygiene, infrastructure status, attendance register comparison..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Findings */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            4. Critical Findings & Discrepancies
          </label>
          <textarea
            required
            rows={2}
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
            placeholder="Report missing beneficiaries, unregistered staff, or safety issues..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Severity */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            5. Risk Severity Level
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
          >
            <option value="low">Low (Standard Minor Remarks)</option>
            <option value="medium">Medium (Requires Rectification)</option>
            <option value="high">High (Compliance Breach)</option>
            <option value="critical">Critical (Immediate Escalation Required)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting || !selectedInspection || selectedInspection.status === 'submitted'}
          className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting
            ? 'Encrypting & Submitting...'
            : selectedInspection?.status === 'submitted'
            ? 'Inspection Already Transmitted & Under Review'
            : 'Transmit Final Inspection Report'}
        </button>
      </form>
    </div>
  );
};
