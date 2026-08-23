'use client';

import React, { useState, useEffect, useRef } from 'react';
import { IIncident, IncidentStatus } from '@/shared/types';

interface UserEvidencePanelProps {
  incident: IIncident | null;
  onClose: () => void;
  onVerify?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

const HEADER_SEVERITY_STYLES: Record<string, { header: string; subtitle: string; closeBtn: string; badge: string }> = {
  critical: {
    header: 'bg-red-600 text-white border-red-700',
    subtitle: 'text-red-100',
    closeBtn: 'text-white/80 hover:text-white hover:bg-white/15',
    badge: 'bg-white/20 text-white border-white/30',
  },
  high: {
    header: 'bg-orange-500 text-white border-orange-600',
    subtitle: 'text-orange-100',
    closeBtn: 'text-white/80 hover:text-white hover:bg-white/15',
    badge: 'bg-white/20 text-white border-white/30',
  },
  medium: {
    header: 'bg-amber-500 text-white border-amber-600',
    subtitle: 'text-amber-100',
    closeBtn: 'text-white/80 hover:text-white hover:bg-white/15',
    badge: 'bg-white/20 text-white border-white/30',
  },
  low: {
    header: 'bg-emerald-600 text-white border-emerald-700',
    subtitle: 'text-emerald-100',
    closeBtn: 'text-white/80 hover:text-white hover:bg-white/15',
    badge: 'bg-white/20 text-white border-white/30',
  },
};

export default function UserEvidencePanel({
  incident,
  onClose,
  onVerify,
  onDismiss,
}: UserEvidencePanelProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on clicking any free space outside the panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        !target.closest('[data-incident-card]') &&
        !target.closest('[data-incident-title]')
      ) {
        onClose();
      }
    };

    // Attach listener with a slight delay so the opening click does not immediately trigger close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!incident) return null;

  const images = incident.imageUrls || [];

  return (
    <div
      ref={panelRef}
      className="flex flex-col h-fit max-h-[calc(100vh-160px)] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden transition-all duration-300 ring-1 ring-black/5"
    >
      {/* Lightbox / Fullscreen Modal for image inspection */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl p-2">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 bg-black/60 text-white rounded-full p-2 hover:bg-black transition-colors"
            >
              ✕
            </button>
            <img
              src={selectedPhoto}
              alt="User Evidence Fullview"
              className="max-h-[80vh] w-auto object-contain rounded-lg mx-auto"
            />
          </div>
        </div>
      )}

      {/* Header (Colored according to Severity Level) */}
      {(() => {
        const style = HEADER_SEVERITY_STYLES[incident.severity] || HEADER_SEVERITY_STYLES.medium;
        return (
          <div className={`p-4 ${style.header} flex items-center justify-between border-b shrink-0 transition-colors shadow-xs`}>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📸</span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base leading-tight">Visitor Evidence Panel</h2>
                  <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${style.badge}`}>
                    {incident.severity}
                  </span>
                </div>
                <p className={`text-xs ${style.subtitle} mt-0.5`}>User-submitted photos & report details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`${style.closeBtn} p-1.5 rounded-lg transition-colors text-sm font-bold`}
              aria-label="Close evidence panel"
            >
              ✕
            </button>
          </div>
        );
      })()}

      {/* Content Body - Auto adjusting height */}
      <div className="overflow-y-auto p-4 space-y-4 bg-slate-50/50 flex-1">
        {/* Incident Summary Card */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {incident.severity}
            </span>
            <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {incident.status}
            </span>
            <span className="text-xs text-slate-400 ml-auto">
              {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <h3 className="font-bold text-slate-900 text-sm leading-snug">{incident.title}</h3>
          
          {incident.description && (
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              {incident.description}
            </p>
          )}

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <span>📍</span>
              <span className="font-medium text-slate-700">{incident.zoneName || incident.zoneId || 'Site Wide'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>👤</span>
              <span className="font-medium text-slate-700 uppercase">Source: {incident.detectionSource}</span>
            </div>
          </div>
        </div>

        {/* User Submitted Photo Evidence Section - Scrollable up to 8 rows */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>📷</span> User Submitted Photos ({images.length})
            </h4>
            {images.length > 0 && <span className="text-[11px] text-slate-400">Click to enlarge</span>}
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300">
              {images.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPhoto(url)}
                  className="group relative cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-black/5 aspect-4/3 hover:shadow-md transition-all shrink-0"
                >
                  <img
                    src={url}
                    alt={`User attachment ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                    <span>🔍</span> Enlarge
                  </div>
                  <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-xs font-mono">
                    Photo {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 px-4 bg-white rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
              <span className="text-2xl mb-1.5">🖼️</span>
              <p className="text-xs font-medium text-slate-600">No images attached</p>
              <p className="text-[11px] mt-0.5">This report was submitted without photo attachments.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions (Verify / Dismiss for flagged incidents) */}
      {incident.status === IncidentStatus.FLAGGED ? (
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onVerify?.(incident.id)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
          >
            Verify Incident
          </button>
          <button
            onClick={() => onDismiss?.(incident.id)}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-lg text-xs transition-colors border border-slate-300 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      ) : (
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 font-medium">Incident Status:</span>
          <span className={`font-bold uppercase px-2 py-0.5 rounded ${
            incident.status === IncidentStatus.VERIFIED ? 'bg-emerald-100 text-emerald-800' :
            incident.status === IncidentStatus.DISMISSED ? 'bg-zinc-200 text-zinc-700' :
            incident.status === IncidentStatus.RESPONDING ? 'bg-purple-100 text-purple-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {incident.status}
          </span>
        </div>
      )}
    </div>
  );
}
