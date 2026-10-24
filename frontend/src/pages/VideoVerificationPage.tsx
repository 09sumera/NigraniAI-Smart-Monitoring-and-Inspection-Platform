import React, { useState } from 'react';
import { PhoneCall, Video, Mic, MicOff, PhoneOff, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

export const VideoVerificationPage: React.FC = () => {
  const [inCall, setInCall] = useState(false);
  const [micMuted, setMicMuted] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Random Video Verification Terminal
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            WebRTC Encrypted
          </span>
        </h1>
        <p className="text-sm text-slate-500">
          Unannounced live video contact with center managers and beneficiaries to corroborate attendance.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-white shadow-xl max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
        {inCall ? (
          <div className="w-full flex flex-col items-center space-y-6">
            <div className="w-full aspect-video rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center animate-pulse">
                  <UserCheck className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-sm font-semibold text-white">Center Director: Ramesh Gupta</p>
                <p className="text-xs text-slate-400">Asha Nidhi Community Center • Stream Live</p>
              </div>

              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>P2P VERIFICATION SECURE</span>
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
                Randomly connects with an on-duty project coordinator to physically demonstrate beneficiaries on premises.
              </p>
            </div>
            <button
              onClick={() => setInCall(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25 transition-all inline-flex items-center gap-2"
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
