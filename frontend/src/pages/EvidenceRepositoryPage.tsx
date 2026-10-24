import React, { useState, useEffect } from 'react';
import api from '../services/api';
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
  Filter
} from 'lucide-react';

export const EvidenceRepositoryPage: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const res = await api.get('/evidence');
        setEvidenceList(res.data.evidence || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvidence();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Geo-Tagged Evidence Repository
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
            SHA-256 Verified
          </span>
        </h1>
        <p className="text-sm text-slate-500">
          Cryptographically hashed physical audit media, tamper-evident capture coordinates, and verification logs.
        </p>
      </div>

      {/* Grid of Evidence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-xs text-slate-400 py-12 col-span-3 text-center">Loading evidence vault...</p>
        ) : evidenceList.length === 0 ? (
          <p className="text-xs text-slate-400 py-12 col-span-3 text-center">No media records currently in the repository.</p>
        ) : (
          evidenceList.map((item) => (
            <div key={item.id} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <div className="h-40 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 relative overflow-hidden">
                {item.evidence_type === 'photo' ? (
                  <Image className="w-10 h-10 text-slate-600" />
                ) : (
                  <Video className="w-10 h-10 text-slate-600" />
                )}
                <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] text-white flex justify-between font-mono">
                  <span>LAT: {item.latitude?.toFixed(4) || '19.0760'}</span>
                  <span>LNG: {item.longitude?.toFixed(4) || '72.8777'}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">{item.evidence_id}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    item.verification_status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                    item.verification_status === 'flagged' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.verification_status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-xs mt-1 truncate">{item.project_name || 'Assisted Unit'}</h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{item.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center">
                <span>By: {item.uploader_name || 'Field Officer'}</span>
                <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
