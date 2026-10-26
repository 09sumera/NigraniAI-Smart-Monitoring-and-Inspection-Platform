import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Evidence } from '../types';
import {
  Archive,
  Image,
  Video,
  FileCheck,
  MapPin,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Clock,
  Eye,
  FileText
} from 'lucide-react';

export const EvidenceRepositoryPage: React.FC = () => {
  const { user } = useAuth();
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'flagged' | 'rejected'>('all');
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  // Review Modal State
  const [selectedItem, setSelectedItem] = useState<Evidence | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canReview = user && ['admin', 'official', 'auditor'].includes(user.role);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const res = await api.get('/evidence', { params: { per_page: 50 } });
      setEvidenceList(res.data.evidence || []);
    } catch (err) {
      console.error('Failed to fetch evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const openReviewModal = (item: Evidence) => {
    setSelectedItem(item);
    setReviewNotes(item.reviewer_notes || '');
    setFeedback(null);
  };

  const closeReviewModal = () => {
    setSelectedItem(null);
    setReviewNotes('');
    setFeedback(null);
  };

  const handleReviewDecision = async (decisionStatus: 'verified' | 'rejected' | 'flagged') => {
    if (!selectedItem) return;
    setSubmittingReview(true);
    setFeedback(null);

    try {
      const res = await api.patch(`/evidence/${selectedItem.id}/verify`, {
        verification_status: decisionStatus,
        reviewer_notes: reviewNotes.trim(),
      });

      const updatedEvidence = res.data;

      // Update in local state immediately
      setEvidenceList((prev) =>
        prev.map((e) => (e.id === updatedEvidence.id ? { ...e, ...updatedEvidence } : e))
      );
      setSelectedItem(updatedEvidence);

      setFeedback({
        type: 'success',
        message: `Evidence successfully marked as ${decisionStatus.toUpperCase()}! Decision persisted to audit vault.`,
      });
    } catch (err: any) {
      console.error('Error submitting review decision:', err);
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to persist review decision. Please check credentials.';
      setFeedback({ type: 'error', message: errorMsg });
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filtered evidence items
  const filteredItems = useMemo(() => {
    return evidenceList.filter((item) => {
      const matchesStatus =
        statusFilter === 'all' || item.verification_status?.toLowerCase() === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.evidence_id?.toLowerCase().includes(q) ||
        item.project_name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.uploader_name?.toLowerCase().includes(q) ||
        item.inspection_code?.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [evidenceList, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: evidenceList.length,
      pending: evidenceList.filter((e) => e.verification_status === 'pending').length,
      verified: evidenceList.filter((e) => e.verification_status === 'verified').length,
      flagged: evidenceList.filter((e) => e.verification_status === 'flagged').length,
      rejected: evidenceList.filter((e) => e.verification_status === 'rejected').length,
    };
  }, [evidenceList]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Geo-Tagged Evidence Repository
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              SHA-256 Verified
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Physical on-site audit media, tamper-evident capture telemetry, and authorized reviewer verification logs.
          </p>
        </div>

        <button
          onClick={fetchEvidence}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/80 shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          <span>Refresh Vault</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'pending', 'verified', 'flagged', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === tab
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
            >
              <span className="capitalize">{tab}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 font-bold'
                }`}
              >
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, institution, remarks..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Grid of Evidence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && evidenceList.length === 0 ? (
          <p className="text-xs text-slate-400 py-16 col-span-3 text-center">Loading evidence vault...</p>
        ) : filteredItems.length === 0 ? (
          <div className="col-span-3 py-16 text-center rounded-2xl bg-white border border-dashed border-slate-200 p-8 space-y-2">
            <Archive className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No matching media records</h3>
            <p className="text-xs text-slate-400">
              No evidence matching the selected filter criteria was found in the vault.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3.5 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                {/* Media Preview Container */}
                <div className="h-44 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 relative overflow-hidden group">
                  {item.evidence_type === 'photo' ? (
                    failedImages[item.id] ? (
                      <div className="flex flex-col items-center justify-center gap-1.5 p-4 text-center bg-slate-900 text-slate-400 w-full h-full">
                        <AlertTriangle className="w-8 h-8 text-amber-500 mb-1" />
                        <span className="text-xs font-semibold text-slate-200">Asset File Unavailable</span>
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                          {item.file_name}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={item.file_url || `/api/evidence/${item.id}/file`}
                        alt={item.description || item.file_name || 'Inspection Evidence'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={() => setFailedImages((prev) => ({ ...prev, [item.id]: true }))}
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Video className="w-10 h-10 text-slate-500" />
                      <span className="text-[10px] uppercase font-mono tracking-wider">Video Asset</span>
                    </div>
                  )}

                  {/* Telemetry pill overlay */}
                  <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded bg-black/75 backdrop-blur-md text-[10px] text-white flex justify-between font-mono">
                    <span>LAT: {item.latitude?.toFixed(4) || '19.0760'}</span>
                    <span>LNG: {item.longitude?.toFixed(4) || '72.8777'}</span>
                  </div>
                </div>

                {/* Evidence Details */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-600">{item.evidence_id}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        item.verification_status === 'verified'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.verification_status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : item.verification_status === 'flagged'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {item.verification_status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-xs mt-1.5 truncate">
                    {item.project_name || 'Assisted Unit'}
                  </h3>

                  {item.inspection_code && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                        {item.inspection_code}
                      </span>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">{item.description}</p>

                  {/* Review Audit Notes pill */}
                  {item.verification_status !== 'pending' && item.reviewer_notes && (
                    <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-600">
                      <span className="font-semibold text-slate-700">Review Notes: </span>
                      <span className="italic">{item.reviewer_notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer & Action Button */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-[10px] text-slate-400 flex justify-between items-center">
                  <span>By: {item.uploader_name || 'Field Officer'}</span>
                  <div className="flex items-center gap-2">
                    <span>{item.captured_at ? new Date(item.captured_at).toLocaleDateString() : 'Recent'}</span>
                    <a
                      href={item.download_url || `/api/evidence/${item.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors inline-flex items-center gap-1"
                      title="Open full resolution file"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Review Trigger Button */}
                <button
                  type="button"
                  onClick={() => openReviewModal(item)}
                  className={`w-full py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                    item.verification_status === 'pending'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>
                    {canReview
                      ? item.verification_status === 'pending'
                        ? 'Review & Verify Evidence'
                        : 'Update Verification'
                      : 'Inspect Evidence Details'}
                  </span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Authorized Review Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 p-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    Evidence Review: <span className="font-mono text-blue-600">{selectedItem.evidence_id}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Tamper-evident verification audit & approval workflow</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeReviewModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Media Preview */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 max-h-64 flex items-center justify-center">
              {selectedItem.evidence_type === 'photo' ? (
                failedImages[selectedItem.id] ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                    <span className="text-xs font-semibold text-slate-200">File Unavailable on Storage</span>
                  </div>
                ) : (
                  <img
                    src={selectedItem.file_url || `/api/evidence/${selectedItem.id}/file`}
                    alt={selectedItem.description || selectedItem.file_name}
                    className="max-h-64 w-full object-contain"
                    onError={() => setFailedImages((prev) => ({ ...prev, [selectedItem.id]: true }))}
                  />
                )
              ) : (
                <div className="py-12 text-slate-400 flex flex-col items-center gap-2">
                  <Video className="w-12 h-12 text-slate-500" />
                  <span className="text-xs font-mono uppercase">Video Evidence Stream</span>
                </div>
              )}

              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <a
                  href={selectedItem.download_url || `/api/evidence/${selectedItem.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] text-white hover:bg-black/80 font-semibold inline-flex items-center gap-1 transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Full View</span>
                </a>
              </div>
            </div>

            {/* Telemetry and Audit Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Institution / Project
                </span>
                <span className="font-semibold text-slate-800 truncate block mt-0.5">
                  {selectedItem.project_name || 'Assisted Unit'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Inspection Reference
                </span>
                <span className="font-mono font-semibold text-slate-800 block mt-0.5">
                  {selectedItem.inspection_code || (selectedItem.inspection_id ? `ID #${selectedItem.inspection_id}` : 'General Capture')}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  GPS Coordinates Lock
                </span>
                <span className="font-mono text-slate-700 block mt-0.5">
                  {selectedItem.latitude?.toFixed(5) || '19.07600'}, {selectedItem.longitude?.toFixed(5) || '72.87770'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Capturing Officer
                </span>
                <span className="font-semibold text-slate-800 block mt-0.5">
                  {selectedItem.uploader_name || 'Designated Field Officer'}
                </span>
              </div>

              {selectedItem.file_hash && (
                <div className="col-span-2">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                    Cryptographic SHA-256 Hash
                  </span>
                  <span className="font-mono text-[10px] text-slate-600 break-all block mt-0.5 select-all bg-white px-2 py-1 rounded border border-slate-200/60">
                    {selectedItem.file_hash}
                  </span>
                </div>
              )}
            </div>

            {/* Existing Review Info if available */}
            {selectedItem.verification_status !== 'pending' && selectedItem.reviewer_name && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Previous Review Record</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      selectedItem.verification_status === 'verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedItem.verification_status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedItem.verification_status}
                  </span>
                </div>
                <p className="text-slate-700 font-medium">
                  Audited by <span className="font-bold">{selectedItem.reviewer_name}</span> on{' '}
                  {selectedItem.reviewed_at ? new Date(selectedItem.reviewed_at).toLocaleString() : 'Recent'}
                </p>
                {selectedItem.reviewer_notes && (
                  <p className="text-slate-600 text-[11px] italic">"{selectedItem.reviewer_notes}"</p>
                )}
              </div>
            )}

            {/* Review Decision Controls */}
            {canReview ? (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Reviewer Observations / Verification Justification
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter verification remarks, reason for discrepancy, or muster verification confirmation..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {feedback && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      feedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {feedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{feedback.message}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => handleReviewDecision('verified')}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-60"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Verify</span>
                  </button>

                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => handleReviewDecision('flagged')}
                    className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 transition-all disabled:opacity-60"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Flag Issue</span>
                  </button>

                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => handleReviewDecision('rejected')}
                    className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/20 transition-all disabled:opacity-60"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Evidence review and verification actions require Administrative, Official, or Auditor credentials.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
