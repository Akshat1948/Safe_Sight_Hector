'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import {
  detectFromImage,
  detectFromBase64,
  analyzeZones,
  DetectionResult,
  VisionAnalysisResponse,
} from '@/shared/api/vision.api';

export default function CameraPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'webcam'>('upload');
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0.35);
  
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [zoneResult, setZoneResult] = useState<VisionAnalysisResponse | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop webcam stream safely
  const stopWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsWebcamActive(true);
        setActiveTab('webcam');
        setSelectedImage(null);
        setDetectionResult(null);
        setZoneResult(null);
        setError(null);
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setError('Could not access webcam. Please check permissions.');
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsDetecting(true);
    setError(null);
    setZoneResult(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      // Stop webcam while showing results (optional - keep it on for now)
      // stopWebcam();
      
      // Update image preview to captured frame
      setSelectedImage(dataUrl);

      // Strip the prefix
      const base64Data = dataUrl.split(',')[1];
      
      try {
        const response = await detectFromBase64(base64Data, confidence);
        if (response.success && response.data) {
          setDetectionResult(response.data);
          if (response.data.annotated_image_base64) {
             setSelectedImage(`data:image/jpeg;base64,${response.data.annotated_image_base64}`);
          }
        } else {
          setError(response.message || 'Detection failed');
        }
      } catch (err) {
        setError('An unexpected error occurred during detection.');
      }
    }
    
    setIsDetecting(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (isWebcamActive) {
      stopWebcam();
    }
    
    setActiveTab('upload');
    setDetectionResult(null);
    setZoneResult(null);
    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsDetecting(true);
    try {
      const response = await detectFromImage(file, confidence);
      if (response.success && response.data) {
        setDetectionResult(response.data);
        if (response.data.annotated_image_base64) {
             setSelectedImage(`data:image/jpeg;base64,${response.data.annotated_image_base64}`);
        }
      } else {
        setError(response.message || 'Detection failed');
      }
      
      // Also trigger zone analysis
      const zoneResp = await analyzeZones(file, false);
      if (zoneResp.success && zoneResp.data) {
         setZoneResult(zoneResp.data);
      }
      
    } catch (err) {
      setError('An unexpected error occurred during detection.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
       // Mock file input change event
       if (fileInputRef.current) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInputRef.current.files = dataTransfer.files;
          
          const event = {
            target: fileInputRef.current
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          
          handleFileUpload(event);
       }
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-400';
    if (percentage < 70) return 'text-yellow-400';
    if (percentage < 90) return 'text-orange-400';
    return 'text-red-500';
  };

  const getStatusBgColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500/20 border-green-500/50';
    if (percentage < 70) return 'bg-yellow-500/20 border-yellow-500/50';
    if (percentage < 90) return 'bg-orange-500/20 border-orange-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="font-headline-md text-on-surface">AI Vision — CCTV & Crowd Detection</h1>
          <p className="text-on-surface-subtle font-body">
            Real-time object detection and density analysis for facility monitoring.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
          
          {/* Left Column - Camera / Image Input */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Viewport */}
            <div 
              className="hud-panel rounded-xl flex-1 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px] border-border-subtle border bg-surface-raised"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {isDetecting && (
                <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                  <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                  <span className="font-label-caps text-on-surface">Processing Image...</span>
                </div>
              )}
              
              {!isWebcamActive && !selectedImage && (
                <div className="flex flex-col items-center justify-center gap-4 text-on-surface-subtle p-8 text-center h-full w-full border-2 border-dashed border-border-subtle m-4 rounded-lg">
                  <span className="material-symbols-outlined text-6xl opacity-50">photo_camera</span>
                  <p className="font-body-bold">No Feed Active</p>
                  <p className="font-body text-sm max-w-sm">
                    Upload an image or start the webcam to begin detection.
                  </p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-6 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded-md transition-colors flex items-center gap-2 font-label-caps"
                  >
                    <span className="material-symbols-outlined">upload_file</span>
                    Browse Files
                  </button>
                </div>
              )}

              {/* Webcam Video */}
              <video 
                ref={videoRef} 
                className={`w-full h-full object-contain ${isWebcamActive && activeTab === 'webcam' ? 'block' : 'hidden'}`}
                autoPlay 
                playsInline 
                muted
              />
              
              {/* Image Preview (Original or Annotated) */}
              {!isWebcamActive && selectedImage && (
                <img 
                  src={selectedImage} 
                  alt="Feed output" 
                  className="w-full h-full object-contain"
                />
              )}

              {/* Hidden Canvas for capturing frames */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Error overlay */}
              {error && (
                <div className="absolute top-4 left-4 right-4 bg-error/20 border border-error text-error p-3 rounded-md flex items-center gap-3 backdrop-blur-md">
                   <span className="material-symbols-outlined">error</span>
                   <p className="text-sm font-body">{error}</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="hud-panel rounded-xl p-4 border-border-subtle border bg-surface-raised flex flex-wrap gap-4 items-center justify-between">
              
              <div className="flex flex-wrap gap-3">
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-surface hover:bg-surface-hover text-on-surface border border-border-subtle rounded-md transition-colors flex items-center gap-2 text-sm font-label-caps"
                >
                  <span className="material-symbols-outlined text-lg">upload</span>
                  Upload Snapshot
                </button>
                
                {isWebcamActive ? (
                  <button 
                    onClick={stopWebcam}
                    className="px-4 py-2 bg-error/20 hover:bg-error/30 text-error border border-error/50 rounded-md transition-colors flex items-center gap-2 text-sm font-label-caps"
                  >
                    <span className="material-symbols-outlined text-lg">videocam_off</span>
                    Stop Webcam
                  </button>
                ) : (
                  <button 
                    onClick={startWebcam}
                    className="px-4 py-2 bg-surface hover:bg-surface-hover text-on-surface border border-border-subtle rounded-md transition-colors flex items-center gap-2 text-sm font-label-caps"
                  >
                    <span className="material-symbols-outlined text-lg">videocam</span>
                    Use Webcam
                  </button>
                )}

                {isWebcamActive && (
                  <button 
                    onClick={handleCapture}
                    disabled={isDetecting}
                    className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded-md transition-colors flex items-center gap-2 text-sm font-label-caps disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">center_focus_strong</span>
                    Capture & Detect
                  </button>
                )}
              </div>

              {/* Confidence Slider */}
              <div className="flex items-center gap-3 bg-surface p-2 rounded-md border border-border-subtle min-w-[200px]">
                <span className="material-symbols-outlined text-on-surface-subtle text-lg">tune</span>
                <div className="flex flex-col w-full gap-1">
                  <div className="flex justify-between text-xs font-telemetry-md text-on-surface-subtle">
                    <span>Threshold</span>
                    <span>{Math.round(confidence * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="0.9" 
                    step="0.05" 
                    value={confidence} 
                    onChange={(e) => setConfidence(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto min-h-0">
            
            {/* KPI Stats Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="hud-panel p-4 rounded-xl border border-border-subtle bg-surface-raised flex flex-col gap-1">
                <span className="text-sm font-label-caps text-on-surface-subtle">Total Persons</span>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-telemetry-md text-primary">
                    {detectionResult ? detectionResult.total_persons : '--'}
                  </span>
                  <span className="material-symbols-outlined text-primary/50 mb-1">groups</span>
                </div>
              </div>
              <div className="hud-panel p-4 rounded-xl border border-border-subtle bg-surface-raised flex flex-col gap-1">
                <span className="text-sm font-label-caps text-on-surface-subtle">Processing Time</span>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-telemetry-md text-on-surface">
                    {detectionResult ? `${Math.round(detectionResult.processing_time_ms)}ms` : '--'}
                  </span>
                  <span className="material-symbols-outlined text-on-surface-subtle mb-1">speed</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="hud-panel p-4 rounded-xl border border-border-subtle bg-surface-raised flex flex-col gap-1">
                <span className="text-sm font-label-caps text-on-surface-subtle">Model Version</span>
                <span className="text-lg font-telemetry-md text-on-surface truncate">
                  {detectionResult ? detectionResult.model_version : 'YOLOv8'}
                </span>
              </div>
               <div className="hud-panel p-4 rounded-xl border border-border-subtle bg-surface-raised flex flex-col gap-1">
                <span className="text-sm font-label-caps text-on-surface-subtle">Confidence Target</span>
                <span className="text-lg font-telemetry-md text-on-surface">
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            </div>

            {/* Zone Breakdown (if available) */}
            {zoneResult && zoneResult.zone_breakdown && zoneResult.zone_breakdown.length > 0 && (
              <div className="hud-panel rounded-xl border border-border-subtle bg-surface-raised overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface">
                  <h3 className="font-label-caps text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined">map</span>
                    Zone Breakdown
                  </h3>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  {zoneResult.zone_breakdown.map((zone) => (
                    <div key={zone.zone_id} className={`p-3 rounded-lg border ${getStatusBgColor(zone.density_percentage)} flex items-center justify-between`}>
                       <div>
                         <div className="font-body-bold text-on-surface">{zone.zone_name}</div>
                         <div className="text-xs font-telemetry-md text-on-surface-subtle">
                           {zone.headcount} / {zone.max_capacity} capacity
                         </div>
                       </div>
                       <div className="flex flex-col items-end">
                         <span className={`text-lg font-telemetry-md ${getStatusColor(zone.density_percentage)}`}>
                           {zone.density_percentage.toFixed(1)}%
                         </span>
                         <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-background/50 ${getStatusColor(zone.density_percentage)}`}>
                            {zone.density_status}
                         </span>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detection Log Table */}
            <div className="hud-panel rounded-xl border border-border-subtle bg-surface-raised overflow-hidden flex flex-col flex-1 min-h-[300px]">
              <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface sticky top-0">
                <h3 className="font-label-caps text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined">list_alt</span>
                  Detection Log
                </h3>
                <span className="text-xs bg-surface-hover px-2 py-1 rounded text-on-surface-subtle font-telemetry-md">
                  {detectionResult?.detections.length || 0} Records
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-hover/50 text-xs font-label-caps text-on-surface-subtle">
                      <th className="p-3 pl-4 font-normal">#</th>
                      <th className="p-3 font-normal">Label</th>
                      <th className="p-3 font-normal">Confidence</th>
                      <th className="p-3 pr-4 font-normal text-right">Coords (x,y)</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-telemetry-md">
                    {detectionResult?.detections && detectionResult.detections.length > 0 ? (
                      detectionResult.detections.map((det, idx) => (
                        <tr key={idx} className="border-b border-border-subtle/50 hover:bg-surface-hover/50 transition-colors">
                          <td className="p-3 pl-4 text-on-surface-subtle">{idx + 1}</td>
                          <td className="p-3 text-on-surface capitalize">{det.label}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="w-8 text-right">{Math.round(det.confidence * 100)}%</span>
                              <div className="w-16 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary" 
                                  style={{ width: `${det.confidence * 100}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3 pr-4 text-right text-on-surface-subtle text-xs">
                            [{Math.round(det.x1)},{Math.round(det.y1)}]
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-on-surface-subtle">
                          <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                            <span className="material-symbols-outlined text-4xl">radar</span>
                            <span className="font-body text-sm">No active detections</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
