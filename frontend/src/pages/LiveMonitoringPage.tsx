import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import {
  Activity,
  MapPin,
  Camera,
  ShieldCheck,
  Building,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  Info,
  Radio,
  ExternalLink
} from 'lucide-react';

export const LiveMonitoringPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [totalActive, setTotalActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'moderate' | 'low'>('all');

  const fetchLiveStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/monitoring/status');
      const list = res.data.projects || [];
      setProjects(list);
      setTotalActive(res.data.total_active || 0);
      if (list.length > 0 && !selectedProject) {
        setSelectedProject(list[0]);
      }
    } catch (err) {
      console.error('Failed to fetch live monitoring status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
  }, []);

  // Filtered project list
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.project_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.district?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRisk =
        filterRisk === 'all' ? true :
        filterRisk === 'high' ? (p.risk_level === 'high' || p.risk_level === 'critical' || p.risk_score >= 60) :
        filterRisk === 'moderate' ? (p.risk_level === 'moderate' || (p.risk_score >= 35 && p.risk_score < 60)) :
        (p.risk_level === 'low' || p.risk_score < 35);

      return matchesSearch && matchesRisk;
    });
  }, [projects, searchQuery, filterRisk]);

  // Geographical projection mapping for India:
  // Approximate bounds: Lat 8.0N - 36.0N, Lng 68.0E - 96.0E
  const projectCoordinates = (lat?: number, lng?: number) => {
    const minLat = 8.0;
    const maxLat = 36.0;
    const minLng = 68.0;
    const maxLng = 96.0;

    const safeLat = typeof lat === 'number' && !isNaN(lat) ? Math.min(Math.max(lat, minLat), maxLat) : 20.5937;
    const safeLng = typeof lng === 'number' && !isNaN(lng) ? Math.min(Math.max(lng, minLng), maxLng) : 78.9629;

    const svgWidth = 600;
    const svgHeight = 620;

    // Map longitude to x and latitude to y (inverted for SVG coordinates)
    const x = ((safeLng - minLng) / (maxLng - minLng)) * (svgWidth - 100) + 50;
    const y = svgHeight - (((safeLat - minLat) / (maxLat - minLat)) * (svgHeight - 120) + 60);

    return { x: Math.round(x), y: Math.round(y) };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              National Real-Time Command Map & Field Telemetry
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {totalActive} Active Units
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Interactive GIS geospatial visualization and heartbeat monitoring across nationwide MoSJE institutions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>Real DB Coordinates • Simulated Heartbeat</span>
          </span>
          <button
            onClick={fetchLiveStatus}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Telemetry</span>
          </button>
        </div>
      </div>

      {/* Interactive Command Map & Unit Telemetry Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Viewport Card */}
        <div className="lg:col-span-8 p-5 rounded-3xl bg-slate-950 border border-slate-800 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[560px]">
          {/* Map Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono text-emerald-400 font-bold">GIS SURVEILLANCE RADAR</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">Coverage: 28 States & UTs</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low Risk
              </span>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800/40 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Moderate
              </span>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-800/40 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> High / Critical
              </span>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative w-full h-[460px] flex items-center justify-center my-2">
            <svg
              viewBox="0 0 600 620"
              className="w-full h-full max-h-[460px] select-none"
              style={{ filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.15))' }}
            >
              {/* Decorative Coordinate Grid */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
                </pattern>
                <radialGradient id="centerGlow" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="1" />
                </radialGradient>
              </defs>

              <rect width="600" height="620" fill="url(#centerGlow)" />
              <rect width="600" height="620" fill="url(#grid)" />

              {/* Stylized Representative Boundaries of India */}
              <path
                d="M 240,65 L 290,75 L 340,95 L 375,130 L 415,160 L 440,190 L 515,200 L 545,215 L 530,245 L 485,250 L 445,275 L 420,320 L 390,370 L 375,430 L 325,510 L 295,570 L 265,510 L 220,440 L 195,380 L 180,310 L 160,260 L 190,205 L 210,135 Z"
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="2"
                strokeDasharray="4 2"
                opacity="0.9"
              />

              {/* State Connecting Range Rings */}
              <circle cx="300" cy="310" r="140" fill="none" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" />
              <circle cx="300" cy="310" r="220" fill="none" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="1" />

              {/* Project Pins Plotted by Real Database Coordinates */}
              {projects.map((p) => {
                const { x, y } = projectCoordinates(p.latitude, p.longitude);
                const isSelected = selectedProject?.id === p.id;
                const isHighRisk = p.risk_level === 'high' || p.risk_level === 'critical' || p.risk_score >= 60;
                const isModerate = p.risk_level === 'moderate' || (p.risk_score >= 35 && p.risk_score < 60);

                const pinColor = isHighRisk ? '#ef4444' : isModerate ? '#f59e0b' : '#10b981';

                return (
                  <g
                    key={p.id}
                    className="cursor-pointer transition-transform duration-200"
                    onClick={() => setSelectedProject(p)}
                  >
                    {/* Outer Pulse for selected or high risk */}
                    {(isSelected || isHighRisk) && (
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 16 : 10}
                        fill={pinColor}
                        opacity="0.3"
                        className="animate-ping"
                      />
                    )}
                    {/* Halo ring for selection */}
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r="12"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    )}
                    {/* Pin Circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 7 : 5}
                      fill={pinColor}
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                    {/* Node Label on Select */}
                    {isSelected && (
                      <text
                        x={x}
                        y={y - 12}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        className="bg-black/80 px-1 py-0.5 rounded shadow"
                      >
                        {p.name.slice(0, 16)}...
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Map Footer Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-slate-400 bg-slate-900/60 p-3 rounded-2xl border border-white/5 relative z-10">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>ACTIVE MONITORING FEED • {projects.length} TOTAL REGISTERED STATIONS</span>
            </div>
            <span>COORDINATE MAPPING: WGS84 DATUM</span>
          </div>
        </div>

        {/* Selected Unit Telemetry Inspector */}
        <div className="lg:col-span-4 space-y-4">
          {selectedProject ? (
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                    {selectedProject.project_id}
                  </span>
                  <h2 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                    {selectedProject.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedProject.district}, {selectedProject.state}
                  </p>
                </div>
                <span className={`w-3 h-3 rounded-full shrink-0 ${
                  selectedProject.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`} />
              </div>

              {/* Risk & Compliance Meters */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500">Risk Vulnerability</span>
                  <p className="text-lg font-extrabold text-rose-600 mt-0.5">
                    {selectedProject.risk_score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                  </p>
                  <span className="text-[10px] uppercase font-bold text-rose-700">
                    {selectedProject.risk_level || 'Moderate'} Tier
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500">Compliance Index</span>
                  <p className="text-lg font-extrabold text-blue-600 mt-0.5">
                    {selectedProject.compliance_score || 85.0} <span className="text-xs text-slate-400 font-normal">%</span>
                  </p>
                  <span className="text-[10px] uppercase font-bold text-blue-700">Audit Grade</span>
                </div>
              </div>

              {/* Telemetry Diagnostics */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Institution Category:</span>
                  <span className="font-semibold text-slate-800">{selectedProject.institution_type || 'Trust / Society'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">GPS Coordinates:</span>
                  <span className="font-mono text-slate-700 text-[11px]">
                    {selectedProject.latitude ? `${selectedProject.latitude.toFixed(4)}°N, ${selectedProject.longitude.toFixed(4)}°E` : '28.6139°N, 77.2090°E'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">CCTV Telemetry:</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>{selectedProject.camera_count || 1} Node(s) Configured</span>
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Active Beneficiaries:</span>
                  <span className="font-bold text-slate-800">
                    {selectedProject.registered_beneficiaries || 0} / {selectedProject.sanctioned_capacity || 50}
                  </span>
                </div>
              </div>

              {/* Navigation Action */}
              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <a
                  href={`/cctv`}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs text-center transition-all flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>View Camera Grid</span>
                </a>
                <a
                  href={`/projects`}
                  className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs text-center transition-all"
                >
                  Details
                </a>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm text-center text-slate-400 text-xs">
              Select a facility pin on the radar map to inspect live telemetry.
            </div>
          )}

          {/* Telemetry Overview Card */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Surveillance Telemetry Note</span>
            </p>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Geospatial pins represent physical institution locations stored in the database. Sensor heartbeats and telemetry streams run in continuous simulation mode for audit demonstration.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar for Stations Grid */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter by facility name, state, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Risk Tier:</span>
          {(['all', 'high', 'moderate', 'low'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setFilterRisk(tier)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterRisk === tier
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Monitored Project Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-xs text-slate-400 py-12 col-span-3 text-center">Contacting field telemetry servers...</p>
        ) : filteredProjects.length === 0 ? (
          <p className="text-xs text-slate-400 py-12 col-span-3 text-center">No units match the specified search or filter.</p>
        ) : (
          filteredProjects.map((p) => {
            const isSelected = selectedProject?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all space-y-3 ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200/80 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-500">{p.project_id}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {p.telemetry_status === 'nominal' ? 'Nominal' : 'Elevated'}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${
                      p.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`} />
                  </div>
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
            );
          })
        )}
      </div>
    </div>
  );
};