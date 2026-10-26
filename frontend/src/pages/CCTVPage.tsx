import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '../services/api';
import { Camera } from '../types';
import {
  Video,
  VideoOff,
  Eye,
  RefreshCw,
  ShieldCheck,
  Activity,
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Grid,
  Layout,
  Camera as CameraIcon,
  AlertTriangle,
  CheckCircle,
  Info,
  HelpCircle,
  StopCircle,
  Search,
  Filter,
  ExternalLink,
  Building,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';

export const CCTVPage: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCam, setSelectedCam] = useState<Camera | null>(null);
  const [viewMode, setViewMode] = useState<'focus' | 'quad' | 'gallery'>('focus');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'simulated' | 'disconnected'>('all');

  // Video Playback Controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
  const [currentTime, setCurrentTime] = useState<string>(new Date().toISOString());

  // Local Webcam State
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [webcamTarget, setWebcamTarget] = useState(false); // whether main viewport focuses on webcam

  // Telemetry Heartbeat State
  const [heartbeatSending, setHeartbeatSending] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // Refs
  const mainVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const mainViewportContainerRef = useRef<HTMLDivElement | null>(null);

  // Keep live timecode updated
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch camera records from database
  const fetchCameras = async () => {
    setLoading(true);
    try {
      const res = await api.get('/monitoring/cameras');
      const list = res.data.cameras || [];
      setCameras(list);
      if (list.length > 0 && !selectedCam) {
        setSelectedCam(list[0]);
      }
    } catch (err) {
      console.error('Failed to load camera grid', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  // Sync webcam stream to video element
  useEffect(() => {
    if (webcamActive && webcamStream && webcamVideoRef.current) {
      webcamVideoRef.current.srcObject = webcamStream;
      webcamVideoRef.current.play().catch((err) => {
        console.warn('Webcam autoplay was prevented:', err);
      });
    }
  }, [webcamActive, webcamStream, webcamTarget, viewMode]);

  // Clean up webcam tracks on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [webcamStream]);

  // Resolve video source for a given camera based on its location
  const getVideoSrc = (camera?: Camera | null) => {
    if (!camera) return '/videos/common_area.mp4';
    if (camera.stream_url && (camera.stream_url.startsWith('http') || camera.stream_url.startsWith('/'))) {
      return camera.stream_url;
    }
    const loc = (camera.location_desc || '').toLowerCase();
    if (loc.includes('entrance') || loc.includes('gate') || loc.includes('entry') || loc.includes('perimeter')) {
      return '/videos/entrance.mp4';
    }
    if (loc.includes('corridor') || loc.includes('passage') || loc.includes('hallway') || loc.includes('walkway')) {
      return '/videos/corridor.mp4';
    }
    if (loc.includes('kitchen') || loc.includes('dining') || loc.includes('mess') || loc.includes('food') || loc.includes('canteen')) {
      return '/videos/kitchen.mp4';
    }
    if (loc.includes('hall') || loc.includes('activity') || loc.includes('recreation')) {
      return '/videos/hall.mp4';
    }
    return '/videos/common_area.mp4';
  };

  // Start Local Webcam
  const handleStartWebcam = async () => {
    setWebcamError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam capture (navigator.mediaDevices.getUserMedia) is not supported by this browser environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      setWebcamStream(stream);
      setWebcamActive(true);
      setWebcamTarget(true); // Switch focus to webcam
      setFeedbackMsg('Live local webcam stream attached successfully.');
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err: any) {
      console.error('Webcam initialization failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setWebcamError('Camera permission was denied. Please permit camera access in your browser address bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setWebcamError('No local webcam hardware detected on this machine.');
      } else {
        setWebcamError(err.message || 'Unable to access local webcam device.');
      }
    }
  };

  // Stop Local Webcam
  const handleStopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      setWebcamStream(null);
    }
    setWebcamActive(false);
    setWebcamTarget(false);
    setWebcamError(null);
    setFeedbackMsg('Local webcam stream released.');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  // Play/Pause toggle
  const togglePlayPause = () => {
    if (webcamTarget && webcamVideoRef.current) {
      if (webcamVideoRef.current.paused) {
        webcamVideoRef.current.play();
        setIsPlaying(true);
      } else {
        webcamVideoRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (mainVideoRef.current) {
      if (mainVideoRef.current.paused) {
        mainVideoRef.current.play();
        setIsPlaying(true);
      } else {
        mainVideoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!mainViewportContainerRef.current) return;
    if (!document.fullscreenElement) {
      mainViewportContainerRef.current.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Telemetry Heartbeat action
  const handleSendHeartbeat = async () => {
    if (!selectedCam) return;
    setHeartbeatSending(true);
    setFeedbackMsg('');
    try {
      await api.post(`/monitoring/cameras/${selectedCam.id}/heartbeat`);
      setFeedbackMsg(`Heartbeat acknowledged by Node #${selectedCam.id}. Status updated to CONNECTED.`);
      setSelectedCam((prev) => (prev ? { ...prev, status: 'connected' } : null));
      setCameras((prev) =>
        prev.map((c) => (c.id === selectedCam.id ? { ...c, status: 'connected' } : c))
      );
      setTimeout(() => setFeedbackMsg(''), 4500);
    } catch (err) {
      setFeedbackMsg('Failed to dispatch heartbeat to node.');
    } finally {
      setHeartbeatSending(false);
    }
  };

  // Filter cameras
  const filteredCameras = useMemo(() => {
    return cameras.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.project_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.location_desc || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' ? true : c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cameras, searchQuery, statusFilter]);

  // Distinct camera selection for 2x2 Quad Grid (takes 4 distinct representative locations)
  const quadCameras = useMemo(() => {
    if (cameras.length === 0) return [];
    // Prefer cameras with different locations
    const entrance = cameras.find((c) => (c.location_desc || '').toLowerCase().includes('entrance')) || cameras[0];
    const corridor = cameras.find((c) => (c.location_desc || '').toLowerCase().includes('corridor') && c.id !== entrance?.id) || cameras[1] || cameras[0];
    const kitchen = cameras.find((c) => (c.location_desc || '').toLowerCase().includes('kitchen') && c.id !== entrance?.id && c.id !== corridor?.id) || cameras[2] || cameras[0];
    const common = cameras.find((c) => c.id !== entrance?.id && c.id !== corridor?.id && c.id !== kitchen?.id) || cameras[3] || cameras[0];
    return [entrance, corridor, kitchen, common].filter(Boolean);
  }, [cameras]);

  return (
    <div className="space-y-6">
      {/* Page Title & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Centralized CCTV Surveillance Grid
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              Demo Operations Center
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time visual telemetry, perimeter feeds, and dormitory monitoring for assisted institutions.
          </p>
        </div>

        {/* View Mode & Help Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Tabs */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm text-xs font-semibold">
            <button
              onClick={() => {
                setViewMode('focus');
                setWebcamTarget(false);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'focus' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Focus</span>
            </button>
            <button
              onClick={() => setViewMode('quad')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'quad' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>2×2 Quad</span>
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'gallery' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Gallery</span>
            </button>
          </div>

          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
            title="Demonstration Guide"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
          </button>

          <button
            onClick={fetchCameras}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Demonstration Banner & Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Smart India Hackathon 2026 Evaluation Sandbox</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                DEMO MODE ACTIVE
              </span>
            </div>
            <p className="text-xs text-blue-200/80 mt-0.5">
              Prerecorded generic institutional sample footage (entrances, corridors, kitchens, and halls) simulates active facility node streams. Local laptop webcam demonstrates real hardware integration.
            </p>
          </div>
        </div>

        {/* Local Webcam Action Pill */}
        <div className="shrink-0 flex items-center gap-2">
          {!webcamActive ? (
            <button
              onClick={handleStartWebcam}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <CameraIcon className="w-4 h-4" />
              <span>Start Local Webcam Demo</span>
            </button>
          ) : (
            <button
              onClick={handleStopWebcam}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              <span>Stop Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Demonstration Guide Drawer (Help) */}
      {showHelp && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-2 animate-in fade-in duration-200">
          <p className="font-bold flex items-center gap-2 text-sm text-blue-900">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Hackathon Evaluation Guide: How to Test CCTV Feeds</span>
          </p>
          <ul className="list-disc list-inside space-y-1 text-blue-900 leading-relaxed">
            <li>
              <strong>Prerecorded Institutional Spaces:</strong> Click any camera in the sidebar (Entrance, Corridor, Kitchen, Common Hall) to verify automatic loop playback, responsive switching, and live OSD telemetry overlays.
            </li>
            <li>
              <strong>Live Hardware Testing:</strong> Click <em>"Start Local Webcam Demo"</em> to stream your laptop camera live on the CCTV viewport using <code className="bg-blue-100 px-1 py-0.5 rounded">getUserMedia</code> without uploading data.
            </li>
            <li>
              <strong>Multi-Camera Operation:</strong> Toggle between <strong>Focus Mode</strong> and <strong>2×2 Quad Grid</strong> to view 4 concurrent feeds simultaneously.
            </li>
            <li>
              <strong>Telemetry Heartbeat:</strong> Click <em>"Send Node Heartbeat"</em> to dispatch a live POST heartbeat to the backend and update the database status to CONNECTED.
            </li>
          </ul>
        </div>
      )}

      {/* Webcam Permission/Hardware Error Banner */}
      {webcamError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-rose-900">Webcam Hardware Access Notice</p>
            <p>{webcamError}</p>
          </div>
        </div>
      )}

      {/* Telemetry Feedback Toast */}
      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{feedbackMsg}</span>
        </div>
      )}

      {/* MAIN VIEWPORT / LAYOUT CONTAINER */}
      {viewMode === 'focus' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed Viewport */}
          <div className="lg:col-span-2 space-y-4">
            <div
              ref={mainViewportContainerRef}
              className="rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl aspect-video relative flex items-center justify-center group"
            >
              {/* WEBCAM FEED MODE */}
              {webcamTarget && webcamActive ? (
                <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
                  <video
                    ref={webcamVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* CCTV Telemetry Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none flex flex-col justify-between p-6">
                    <div className="flex justify-between items-start text-xs font-mono text-emerald-400">
                      <div className="flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="font-bold">LIVE WEBCAM // LOCAL CLIENT HARDWARE</span>
                      </div>
                      <span className="bg-black/70 px-2.5 py-1 rounded-md border border-white/10 backdrop-blur-md text-amber-300">
                        FPS: 30.0 • UNENCRYPTED LOCAL PREVIEW
                      </span>
                    </div>

                    <div className="flex justify-between items-end text-xs font-mono text-slate-300">
                      <div className="bg-black/70 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                        <p className="font-bold text-white">Local Laptop Video Device</p>
                        <p className="text-[11px] text-slate-400">Direct Hardware Loopback • No Network Transmission</p>
                      </div>
                      <span className="bg-black/70 px-2.5 py-1 rounded-md border border-white/10 backdrop-blur-md">
                        {currentTime}
                      </span>
                    </div>
                  </div>
                </div>
              ) : selectedCam ? (
                /* PRERECORDED DEMO CAMERA FEED */
                <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
                  {videoErrors[selectedCam.id] ? (
                    /* Video Error Fallback State */
                    <div className="p-8 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                        <VideoOff className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Video Stream Offline</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                          Unable to retrieve footage for {selectedCam.name} ({selectedCam.location_desc}). Stream endpoint is unreachable.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setVideoErrors((prev) => ({ ...prev, [selectedCam.id]: false }));
                          if (mainVideoRef.current) mainVideoRef.current.load();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-all inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Stream Connection</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={mainVideoRef}
                        key={selectedCam.id}
                        src={getVideoSrc(selectedCam)}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        onError={() => setVideoErrors((prev) => ({ ...prev, [selectedCam.id]: true }))}
                        className="w-full h-full object-cover"
                      />

                      {/* CCTV Professional OSD (On-Screen Display) Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none flex flex-col justify-between p-5 sm:p-6">
                        {/* Top Bar */}
                        <div className="flex justify-between items-start text-xs font-mono">
                          <div className="flex items-center gap-2 bg-black/75 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md text-emerald-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-bold">SIMULATED FEED // {selectedCam.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-black/75 px-2.5 py-1 rounded-lg border border-white/10 backdrop-blur-md text-amber-300 text-[11px]">
                              DEMO FOOTAGE
                            </span>
                            <span className="bg-black/75 px-2.5 py-1 rounded-lg border border-white/10 backdrop-blur-md text-slate-300 text-[11px]">
                              FPS: 25.0 • REC [ON]
                            </span>
                          </div>
                        </div>

                        {/* Middle Center Info Tag */}
                        <div className="flex justify-center">
                          <div className="px-4 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-center">
                            <p className="text-xs font-bold text-white truncate max-w-xs">{selectedCam.project_name}</p>
                            <p className="text-[10px] text-slate-300">
                              Zone: {selectedCam.location_desc} • Authorized MoSJE Surveillance Node
                            </p>
                          </div>
                        </div>

                        {/* Bottom Bar */}
                        <div className="flex justify-between items-end text-[11px] font-mono text-slate-300">
                          <div className="bg-black/75 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                            <span>DB TELEMETRY: </span>
                            <span className={`font-bold ${
                              selectedCam.status === 'connected' ? 'text-emerald-400' : 'text-blue-400'
                            }`}>
                              {selectedCam.status.toUpperCase()}
                            </span>
                          </div>
                          <span className="bg-black/75 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                            {currentTime}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Select a camera node from the registry to inspect telemetry.</p>
              )}

              {/* Viewport Floating Quick Controls (Visible on Hover) */}
              <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-black/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 opacity-90 hover:opacity-100 transition-opacity">
                <button
                  onClick={togglePlayPause}
                  className="p-2 rounded-xl text-white hover:bg-white/20 transition-colors"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-xl text-white hover:bg-white/20 transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-xl text-white hover:bg-white/20 transition-colors"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Selected Camera Detail & Telemetry Bar */}
            {selectedCam && (
              <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{selectedCam.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                      ID: {selectedCam.id}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      selectedCam.status === 'connected'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : selectedCam.status === 'simulated'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {selectedCam.status === 'connected' ? 'Connected • Live Heartbeat' : 'Simulated Stream'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {selectedCam.project_name} — <span className="font-semibold text-slate-700">{selectedCam.location_desc}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendHeartbeat}
                    disabled={heartbeatSending}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>{heartbeatSending ? 'Pinging Node...' : 'Send Node Heartbeat'}</span>
                  </button>

                  {webcamActive && (
                    <button
                      onClick={() => setWebcamTarget(!webcamTarget)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 border ${
                        webcamTarget
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <CameraIcon className="w-3.5 h-3.5" />
                      <span>{webcamTarget ? 'View Prerecorded' : 'View Local Webcam'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Camera List Sidebar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col h-[580px]">
            <div className="mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Active Camera Registry ({filteredCameras.length})
                </h2>
                <span className="text-[10px] text-slate-400 font-mono">SQLite Stored</span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter cameras or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                {(['all', 'connected', 'simulated', 'disconnected'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-0.5 rounded-lg capitalize whitespace-nowrap font-medium transition-colors ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Webcam Quick Access Tile */}
            {webcamActive && (
              <div
                onClick={() => setWebcamTarget(true)}
                className={`p-3 rounded-2xl mb-2 border cursor-pointer transition-all flex items-center justify-between ${
                  webcamTarget
                    ? 'border-blue-600 bg-blue-50/80 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <CameraIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Local Hardware Webcam</p>
                    <p className="text-[10px] text-slate-500">Active User Media Preview</p>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
            )}

            {/* Camera Nodes Scroll List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loading ? (
                <p className="text-xs text-slate-400 py-8 text-center">Discovering camera nodes...</p>
              ) : filteredCameras.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No camera records match the query.</p>
              ) : (
                filteredCameras.map((c) => {
                  const isSelected = selectedCam?.id === c.id && !webcamTarget;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCam(c);
                        setWebcamTarget(false);
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-500/30'
                          : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-800 truncate">{c.name}</p>
                          <span className="text-[10px] font-mono text-slate-400">#{c.id}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium truncate">{c.project_name}</p>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{c.location_desc}</span>
                        </span>
                      </div>
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          c.status === 'connected'
                            ? 'bg-emerald-500'
                            : c.status === 'simulated'
                            ? 'bg-blue-500'
                            : 'bg-rose-500'
                        }`}
                        title={`Status: ${c.status}`}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : viewMode === 'quad' ? (
        /* 2x2 MULTI-CAMERA QUAD GRID VIEW */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Operations Quad Matrix (4 Concurrent Feeds)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                25 FPS Stream
              </span>
            </div>
            <span className="text-xs text-slate-500">Click any stream tile to expand to focus mode</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quadCameras.map((cam, idx) => {
              // If webcam is active, place it in 4th tile for comparison
              const isWebcamSlot = idx === 3 && webcamActive;

              return (
                <div
                  key={cam.id || idx}
                  onClick={() => {
                    if (isWebcamSlot) {
                      setWebcamTarget(true);
                      setViewMode('focus');
                    } else {
                      setSelectedCam(cam);
                      setWebcamTarget(false);
                      setViewMode('focus');
                    }
                  }}
                  className="rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl aspect-video relative group cursor-pointer"
                >
                  {isWebcamSlot ? (
                    <video
                      autoPlay
                      playsInline
                      muted
                      ref={(el) => {
                        if (el && webcamStream) el.srcObject = webcamStream;
                      }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={getVideoSrc(cam)}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Quad Tile OSD */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 p-4 flex flex-col justify-between pointer-events-none">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5 bg-black/70 px-2.5 py-1 rounded-lg backdrop-blur-md text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{isWebcamSlot ? 'LOCAL WEBCAM' : `CAM-0${idx + 1} // ${cam.location_desc}`}</span>
                      </div>
                      <span className="text-[10px] text-amber-300 bg-black/70 px-2 py-0.5 rounded backdrop-blur-md">
                        {isWebcamSlot ? 'CLIENT HARDWARE' : 'SIMULATED'}
                      </span>
                    </div>

                    <div className="flex justify-between items-end text-[11px] font-mono text-slate-300">
                      <span className="truncate max-w-[200px] text-white font-bold">
                        {isWebcamSlot ? 'Client Camera Feed' : cam.project_name}
                      </span>
                      <span className="text-[10px] bg-black/70 px-2 py-0.5 rounded text-slate-300">
                        {currentTime}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ALL CAMERAS GALLERY GRID */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Complete Monitored Station Registry ({filteredCameras.length} Nodes)
            </span>
            <span className="text-xs text-slate-500">Click any camera to switch to full-screen focus inspector</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCameras.map((cam) => (
              <div
                key={cam.id}
                onClick={() => {
                  setSelectedCam(cam);
                  setWebcamTarget(false);
                  setViewMode('focus');
                }}
                className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer space-y-2 group"
              >
                <div className="aspect-video rounded-xl bg-slate-900 overflow-hidden relative">
                  <video
                    src={getVideoSrc(cam)}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{cam.name}</span>
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-300">
                    {cam.status.toUpperCase()}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs truncate">{cam.project_name}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{cam.location_desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
