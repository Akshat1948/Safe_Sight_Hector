'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import {
  detectFromImage,
  detectFromBase64,
  analyzeZones,
  DetectionResult,
  ZoneDetectionResult,
  BoundingBox,
} from '@/shared/api/vision.api';

// 4 Standard Surveillance Quadrants (Normalized Coordinates 0.0 - 1.0)
const SURVEILLANCE_ZONES = [
  {
    id: 'zone-a',
    name: 'Zone A — Main Entry Plaza',
    color: '#3b82f6', // Blue
    borderClass: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
    rect: { x: 0, y: 0, w: 0.5, h: 0.5 },
    maxCapacity: 50,
  },
  {
    id: 'zone-b',
    name: 'Zone B — Riverside Ghat Corridor',
    color: '#eab308', // Yellow
    borderClass: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
    rect: { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    maxCapacity: 30,
  },
  {
    id: 'zone-c',
    name: 'Zone C — Ghat Staircase (Chokepoint)',
    color: '#ef4444', // Red
    borderClass: 'border-red-500/40 bg-red-500/10 text-red-400',
    rect: { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    maxCapacity: 20,
  },
  {
    id: 'zone-d',
    name: 'Zone D — Safe Assembly & Exit',
    color: '#22c55e', // Green
    borderClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    rect: { x: 0, y: 0.5, w: 0.5, h: 0.5 },
    maxCapacity: 60,
  },
];

export default function CameraPage() {
  const [sourceMode, setSourceMode] = useState<'webcam' | 'video' | 'image'>('webcam');
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isLiveDetectionActive, setIsLiveDetectionActive] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  
  const [confidence, setConfidence] = useState<number>(0.35);
  const [autoSyncToBackend, setAutoSyncToBackend] = useState(false);
  const [showZoneGrid, setShowZoneGrid] = useState(true);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [liveDetections, setLiveDetections] = useState<BoundingBox[]>([]);
  const [totalHeadcount, setTotalHeadcount] = useState(0);
  const [zoneCounts, setZoneCounts] = useState<Record<string, number>>({
    'zone-a': 0,
    'zone-b': 0,
    'zone-c': 0,
    'zone-d': 0,
  });
  
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const isLoopRunningRef = useRef(false);
  const lastFpsCalcTime = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);

  // Stop media stream
  const stopMedia = useCallback(() => {
    isLoopRunningRef.current = false;
    setIsLiveDetectionActive(false);
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      videoRef.current.pause();
    }
    setIsWebcamActive(false);
    setIsVideoPlaying(false);
  }, []);

  // Complete Reset / Remove Media
  const clearCurrentMedia = useCallback(() => {
    stopMedia();
    setVideoSrc(null);
    setVideoFileName(null);
    setSelectedImage(null);
    setImageFileName(null);
    setLiveDetections([]);
    setTotalHeadcount(0);
    setZoneCounts({ 'zone-a': 0, 'zone-b': 0, 'zone-c': 0, 'zone-d': 0 });
    setProcessingTime(0);
    setFps(0);
    setError(null);
    
    if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }
  }, [stopMedia]);

  useEffect(() => {
    return () => {
      stopMedia();
    };
  }, [stopMedia]);

  // Start Webcam
  const startWebcam = async () => {
    clearCurrentMedia();
    setSourceMode('webcam');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsWebcamActive(true);
        setIsLiveDetectionActive(true);
      }
    } catch (err) {
      console.error('Error starting webcam:', err);
      setError('Could not access webcam. Please ensure camera permissions are allowed.');
    }
  };

  // Handle Video File Upload
  const loadVideoFile = (file: File) => {
    clearCurrentMedia();
    setSourceMode('video');
    setVideoFileName(file.name);

    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.load();
      videoRef.current.onloadeddata = () => {
        videoRef.current?.play();
        setIsVideoPlaying(true);
        setIsLiveDetectionActive(true);
      };
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadVideoFile(file);
    }
    // Reset input value so same file can be re-selected if desired
    e.target.value = '';
  };

  // Handle Image Upload
  const loadImageFile = async (file: File) => {
    clearCurrentMedia();
    setSourceMode('image');
    setImageFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage(dataUrl);

      // Run single frame detection
      const base64Data = dataUrl.split(',')[1];
      const res = await detectFromBase64(base64Data, confidence, autoSyncToBackend);
      if (res.success && res.data) {
        setTotalHeadcount(res.data.total_persons);
        setLiveDetections(res.data.detections);
        setProcessingTime(res.data.processing_time_ms);
        
        if (res.data.zone_breakdown) {
          const counts: Record<string, number> = {};
          res.data.zone_breakdown.forEach((z) => {
            counts[z.zone_id] = z.headcount;
          });
          setZoneCounts(counts);
        }
      } else {
        setError(res.message || 'Detection failed');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImageFile(file);
    }
    e.target.value = '';
  };

  // Drag & Drop on Video Container
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      loadVideoFile(file);
    } else if (file.type.startsWith('image/')) {
      loadImageFile(file);
    }
  };

  // Draw overlay on canvas
  const drawOverlay = useCallback((
    detections: BoundingBox[],
    videoWidth: number,
    videoHeight: number,
    zones = SURVEILLANCE_ZONES
  ) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw 4 Surveillance Quadrants if enabled
    if (showZoneGrid) {
      zones.forEach((zone) => {
        const x = zone.rect.x * videoWidth;
        const y = zone.rect.y * videoHeight;
        const w = zone.rect.w * videoWidth;
        const h = zone.rect.h * videoHeight;

        // Semi-transparent zone tint
        ctx.fillStyle = `${zone.color}18`;
        ctx.fillRect(x, y, w, h);

        // Dashed zone boundary
        ctx.strokeStyle = zone.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);

        // Zone Tag / Header Banner
        ctx.fillStyle = `${zone.color}dd`;
        const tagText = `${zone.name} (${zoneCounts[zone.id] || 0})`;
        ctx.font = 'bold 11px system-ui, sans-serif';
        const textWidth = ctx.measureText(tagText).width;
        ctx.fillRect(x + 8, y + 8, textWidth + 16, 22);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(tagText, x + 14, y + 23);
      });
    }

    // 2. Draw Detected Person Bounding Boxes
    detections.forEach((det, idx) => {
      const boxWidth = det.x2 - det.x1;
      const boxHeight = det.y2 - det.y1;

      // Glow effect for person boxes
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2.5;

      // Box
      ctx.strokeRect(det.x1, det.y1, boxWidth, boxHeight);
      ctx.shadowBlur = 0; // reset glow

      // Label background
      const label = `Person #${idx + 1} (${Math.round(det.confidence * 100)}%)`;
      ctx.font = 'bold 11px system-ui, sans-serif';
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = '#22c55ecc';
      ctx.fillRect(det.x1, Math.max(0, det.y1 - 20), textWidth + 12, 20);

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, det.x1 + 6, Math.max(14, det.y1 - 6));

      // Tracking dot at feet location
      const feetX = (det.x1 + det.x2) / 2;
      const feetY = det.y2;
      ctx.beginPath();
      ctx.arc(feetX, feetY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, [showZoneGrid, zoneCounts]);

  // Main Continuous Live Frame Processing Loop
  const processLiveFrame = useCallback(async () => {
    if (!isLoopRunningRef.current || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    if (video.paused || video.ended || video.videoWidth === 0) {
      if (isLoopRunningRef.current) {
        requestAnimationFrame(processLiveFrame);
      }
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
    const base64Data = dataUrl.split(',')[1];

    try {
      const res = await detectFromBase64(base64Data, confidence, autoSyncToBackend);
      if (res.success && res.data) {
        setTotalHeadcount(res.data.total_persons);
        setLiveDetections(res.data.detections);
        setProcessingTime(res.data.processing_time_ms);

        if (res.data.zone_breakdown) {
          const counts: Record<string, number> = {};
          res.data.zone_breakdown.forEach((z) => {
            counts[z.zone_id] = z.headcount;
          });
          setZoneCounts(counts);
        }

        // Draw live overlay
        drawOverlay(res.data.detections, video.videoWidth, video.videoHeight);

        // Calculate FPS
        frameCountRef.current += 1;
        const now = Date.now();
        if (now - lastFpsCalcTime.current >= 1000) {
          setFps(frameCountRef.current);
          frameCountRef.current = 0;
          lastFpsCalcTime.current = now;
        }
      }
    } catch (err) {
      console.error('Frame detection error:', err);
    } finally {
      // Keep continuous loop running reliably
      if (isLoopRunningRef.current) {
        setTimeout(processLiveFrame, 120); // ~8-10 FPS live YOLO stream
      }
    }
  }, [confidence, autoSyncToBackend, drawOverlay]);

  // Start or stop live loop
  useEffect(() => {
    if (isLiveDetectionActive && (isWebcamActive || isVideoPlaying)) {
      isLoopRunningRef.current = true;
      processLiveFrame();
    } else {
      isLoopRunningRef.current = false;
    }
  }, [isLiveDetectionActive, isWebcamActive, isVideoPlaying, processLiveFrame]);

  // Redraw overlay for static image
  useEffect(() => {
    if (sourceMode === 'image' && selectedImage && liveDetections.length >= 0) {
      const img = new Image();
      img.onload = () => {
        drawOverlay(liveDetections, img.naturalWidth, img.naturalHeight);
      };
      img.src = selectedImage;
    }
  }, [sourceMode, selectedImage, liveDetections, drawOverlay]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5 max-w-7xl mx-auto pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">videocam</span>
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
                CCTV AI Vision & Real-Time Crowd Detection
              </h1>
            </div>
            <p className="text-on-surface-variant font-body-base text-xs mt-1">
              Live continuous human detection using YOLOv8 with real-time sector area counting & chokepoint analysis.
            </p>
          </div>

          {/* Quick Source Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-lg border border-border-subtle shrink-0">
            <button
              onClick={startWebcam}
              className={`px-3 py-1.5 rounded text-xs font-body-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                sourceMode === 'webcam' && isWebcamActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-sm">videocam</span>
              Live Webcam
            </button>

            <button
              onClick={() => videoFileInputRef.current?.click()}
              className={`px-3 py-1.5 rounded text-xs font-body-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                sourceMode === 'video' && videoSrc
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-sm">movie</span>
              {videoSrc ? 'Change Video' : 'Upload Video'}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-1.5 rounded text-xs font-body-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                sourceMode === 'image' && selectedImage
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-sm">image</span>
              {selectedImage ? 'Change Photo' : 'Upload Photo'}
            </button>

            <input
              type="file"
              ref={videoFileInputRef}
              accept="video/*"
              className="hidden"
              onChange={handleVideoUpload}
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-error/15 border border-error/30 rounded-lg text-error text-xs font-body-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        {/* Main Grid: Left Video / Right Telemetry */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Video / Live Detection Stream */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="hud-panel rounded-xl overflow-hidden flex flex-col">
              {/* Stream Title Bar */}
              <div className="p-3 bg-surface border-b border-border-subtle flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isLiveDetectionActive ? 'bg-red-500 animate-ping' : 'bg-gray-400'}`}></span>
                  <span className="font-label-caps text-xs font-bold text-on-surface uppercase tracking-wider">
                    {sourceMode === 'webcam' ? 'Live Camera Feed' : sourceMode === 'video' ? `CCTV: ${videoFileName || 'Video Stream'}` : `Photo: ${imageFileName || 'Snapshot'}`}
                  </span>
                  {isLiveDetectionActive && (
                    <span className="px-2 py-0.5 bg-red-600/20 border border-red-500 text-red-400 rounded text-[10px] font-mono font-bold animate-pulse">
                      LIVE DETECT ON
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-on-surface-variant cursor-pointer font-telemetry-md">
                    <input
                      type="checkbox"
                      checked={showZoneGrid}
                      onChange={(e) => setShowZoneGrid(e.target.checked)}
                      className="rounded border-border-subtle text-primary"
                    />
                    Sector Grid
                  </label>

                  <label className="flex items-center gap-1.5 text-xs text-on-surface-variant cursor-pointer font-telemetry-md">
                    <input
                      type="checkbox"
                      checked={autoSyncToBackend}
                      onChange={(e) => setAutoSyncToBackend(e.target.checked)}
                      className="rounded border-border-subtle text-primary"
                    />
                    Sync Mission Control
                  </label>

                  {/* Remove / Clear Button in Top Bar */}
                  {(videoSrc || selectedImage || isWebcamActive) && (
                    <button
                      onClick={clearCurrentMedia}
                      title="Remove current media and reset"
                      className="p-1 px-2 text-[11px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded font-body-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">delete</span>
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Video & Canvas Container with Drag and Drop */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={handleDrop}
                className={`relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden transition-all ${
                  isDraggingOver ? 'ring-4 ring-primary ring-inset' : ''
                }`}
              >
                {/* Hidden Capture Canvas */}
                <canvas ref={canvasRef} className="hidden" />

                {/* HTML5 Video Element */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  controls={sourceMode === 'video'}
                  loop={sourceMode === 'video'}
                  className={`w-full h-full object-contain ${sourceMode === 'image' ? 'hidden' : 'block'}`}
                />

                {/* Static Image Preview */}
                {sourceMode === 'image' && selectedImage && (
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                )}

                {/* Live Detection Overlay Canvas (Bounding boxes + Sector Lines) */}
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
                />

                {/* Drag Overlay State */}
                {isDraggingOver && (
                  <div className="absolute inset-0 bg-primary/20 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 pointer-events-none">
                    <span className="material-symbols-outlined text-5xl animate-bounce">upload_file</span>
                    <span className="font-body-bold text-sm mt-2">Drop Video or Image to Test</span>
                  </div>
                )}

                {/* Empty State Prompt */}
                {!isWebcamActive && !videoSrc && !selectedImage && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
                    <span className="material-symbols-outlined text-6xl text-primary/60 mb-3 animate-pulse">
                      videocam
                    </span>
                    <h3 className="font-body-bold text-base text-on-surface">No Active Video or Camera</h3>
                    <p className="text-xs text-on-surface-variant font-telemetry-md max-w-sm mt-1 mb-4">
                      Upload a CCTV crowd video, drag & drop a file here, or start your live webcam.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        onClick={startWebcam}
                        className="px-4 py-2 bg-primary text-white rounded font-body-bold text-xs hover:bg-primary/90 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">videocam</span>
                        Start Live Webcam
                      </button>
                      <button
                        onClick={() => videoFileInputRef.current?.click()}
                        className="px-4 py-2 bg-surface-container border border-border-subtle text-on-surface rounded font-body-bold text-xs hover:bg-surface-container-high transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">movie</span>
                        Choose Video File
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-surface-container border border-border-subtle text-on-surface rounded font-body-bold text-xs hover:bg-surface-container-high transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">image</span>
                        Choose Photo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Stream Controls Toolbar */}
              <div className="p-3 bg-surface border-t border-border-subtle flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {(isWebcamActive || isVideoPlaying) && (
                    <button
                      onClick={() => setIsLiveDetectionActive((prev) => !prev)}
                      className={`px-3 py-1.5 rounded text-xs font-body-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isLiveDetectionActive
                          ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {isLiveDetectionActive ? 'pause' : 'play_arrow'}
                      </span>
                      {isLiveDetectionActive ? 'Pause Detection' : 'Resume Detection'}
                    </button>
                  )}

                  {/* Change Video Button */}
                  {sourceMode === 'video' && videoSrc && (
                    <button
                      onClick={() => videoFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 rounded text-xs font-body-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">file_upload</span>
                      Change Video
                    </button>
                  )}

                  {/* Remove Video / Reset Button */}
                  {(isWebcamActive || videoSrc || selectedImage) && (
                    <button
                      onClick={clearCurrentMedia}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-body-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      Remove & Reset
                    </button>
                  )}
                </div>

                {/* Confidence Slider */}
                <div className="flex items-center gap-2 text-xs font-telemetry-md text-on-surface-variant">
                  <span>Sensitivity:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="0.85"
                    step="0.05"
                    value={confidence}
                    onChange={(e) => setConfidence(parseFloat(e.target.value))}
                    className="w-24 accent-primary cursor-pointer"
                  />
                  <span className="font-bold text-on-surface w-8">{Math.round(confidence * 100)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Telemetry & Per-Area Breakdown */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="hud-panel p-4 rounded-xl flex flex-col justify-between">
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold">
                  Total Detected
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-primary font-telemetry-md">
                    {totalHeadcount}
                  </span>
                  <span className="text-xs text-on-surface-variant font-bold">people</span>
                </div>
              </div>

              <div className="hud-panel p-4 rounded-xl flex flex-col justify-between">
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase font-bold">
                  Inference Speed
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-status-nominal font-mono">
                    {processingTime.toFixed(0)}
                  </span>
                  <span className="text-xs text-on-surface-variant">ms ({fps} FPS)</span>
                </div>
              </div>
            </div>

            {/* Per-Area / Sector Breakdown Card */}
            <div className="hud-panel p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">grid_view</span>
                  <h3 className="font-body-bold text-xs text-on-surface uppercase tracking-wider">
                    Sector Area Breakdown
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-on-surface-variant uppercase">
                  4 Quadrants
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {SURVEILLANCE_ZONES.map((zone) => {
                  const count = zoneCounts[zone.id] || 0;
                  const pct = Math.min(100, Math.round((count / zone.maxCapacity) * 100));
                  const isCritical = pct >= 80;
                  const isWarning = pct >= 50 && pct < 80;

                  return (
                    <div
                      key={zone.id}
                      className={`p-3 rounded-lg border flex flex-col gap-1.5 transition-all ${
                        isCritical
                          ? 'border-red-500/60 bg-red-500/10'
                          : isWarning
                          ? 'border-yellow-500/40 bg-yellow-500/5'
                          : 'border-border-subtle bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-body-bold text-xs text-on-surface truncate">
                          {zone.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                            isCritical
                              ? 'bg-red-600 text-white animate-pulse'
                              : isWarning
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {count} / {zone.maxCapacity} ({pct}%)
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Person Detections Roster */}
            <div className="hud-panel p-4 rounded-xl flex flex-col gap-2.5 max-h-60 overflow-y-auto">
              <h3 className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
                Active Bounding Boxes ({liveDetections.length})
              </h3>
              {liveDetections.length === 0 ? (
                <div className="text-center py-4 text-xs font-telemetry-md text-on-surface-variant">
                  No people in frame
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {liveDetections.map((det, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs font-mono p-2 bg-surface-container rounded border border-border-subtle"
                    >
                      <span className="text-on-surface font-bold">Person #{idx + 1}</span>
                      <span className="text-primary">{Math.round(det.confidence * 100)}% Conf</span>
                      <span className="text-on-surface-variant text-[10px]">
                        [{Math.round(det.x1)}, {Math.round(det.y1)}]
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
