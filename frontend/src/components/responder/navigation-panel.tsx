'use client';

import React from 'react';
import { IIncident } from '@/shared/types';
import { updateIncidentStatus } from '@/shared/api';

interface NavigationPanelProps {
  incident: IIncident | null;
  onStatusUpdate?: (id: string, status: 'responding' | 'resolved') => void;
}

export default function NavigationPanel({ incident, onStatusUpdate }: NavigationPanelProps) {
  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-[#F3F4F1] p-8">
        <span className="text-5xl mb-4">🗺️</span>
        <h3 className="text-xl font-semibold text-slate-600">Select an Incident</h3>
        <p className="text-center text-sm mt-2 max-w-sm">
          Select an active dispatch from the list to view detailed location information and navigate to the scene.
        </p>
      </div>
    );
  }

  const handleUpdate = async (status: 'responding' | 'resolved') => {
    if (onStatusUpdate) {
      onStatusUpdate(incident.id, status);
    } else {
      await updateIncidentStatus(incident.id, status);
    }
  };

  const mapUrl = incident.location
    ? `https://www.google.com/maps/search/?api=1&query=${incident.location.coordinates[1]},${incident.location.coordinates[0]}`
    : '#';

  const severityHeaderColors: Record<string, string> = {
    critical: 'bg-red-600/70 backdrop-blur-md',
    high: 'bg-orange-500/70 backdrop-blur-md',
    medium: 'bg-amber-500/70 backdrop-blur-md',
    low: 'bg-blue-500/70 backdrop-blur-md',
  };

  const headerBg = severityHeaderColors[incident.severity?.toLowerCase()] || 'bg-slate-900';

  return (
    <div className="flex flex-col h-full bg-[#F3F4F1] overflow-hidden">
      {/* Header Dynamic Translucent Severity Color */}
      <div className="bg-slate-900/50">
        <div className={`${headerBg} text-white p-6 transition-colors duration-300 shadow-sm`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-white/20 backdrop-blur-xs border border-white/20">
              {incident.severity} Priority
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-white shadow-xs border border-white/40 ${
                incident.status?.toLowerCase() === 'verified'
                  ? 'text-emerald-600'
                  : incident.status?.toLowerCase() === 'responding'
                  ? 'text-purple-600'
                  : incident.status?.toLowerCase() === 'resolved'
                  ? 'text-sky-600'
                  : 'text-slate-800'
              }`}
            >
              {incident.status}
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-1 tracking-tight">{incident.title || incident.incidentType?.replace('_', ' ')}</h2>
          <p className="text-white/90 text-sm flex items-center gap-2 font-medium">
            <span>📍</span> Zone: {incident.zoneName || incident.zoneId || 'Site Wide'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F3F4F1]">
        {/* Description Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Incident Details</h3>
          <p className="text-slate-800 text-sm leading-relaxed">{incident.description || 'No additional description provided.'}</p>
          <div className="mt-4 flex gap-6 text-sm text-slate-600 border-t border-slate-100 pt-3">
            <div>
              <span className="font-semibold block text-xs text-slate-500 uppercase">Detected By</span>
              <span className="uppercase font-medium">{incident.detectionSource || 'System'}</span>
            </div>
            {incident.confidenceScore && (
              <div>
                <span className="font-semibold block text-xs text-slate-500 uppercase">Confidence</span>
                <span className="font-medium">{Math.round(incident.confidenceScore * 100)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Location / Map Action Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Location & Navigation</h3>
          {incident.location ? (
            <div className="text-sm text-slate-700 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 inline-block w-fit">
              Latitude: {incident.location.coordinates[1].toFixed(6)}, Longitude:{' '}
              {incident.location.coordinates[0].toFixed(6)}
            </div>
          ) : (
            <p className="text-sm text-slate-500">GPS coordinates not available for this incident.</p>
          )}

          {incident.location && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg text-center transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <span>🧭</span> Open in Google Maps
            </a>
          )}
        </div>

        {/* Response Action Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Response Action</h3>
          <div className="flex flex-col gap-4">
            {incident.status === 'verified' && (
              <button
                onClick={() => handleUpdate('responding')}
                className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-sm text-lg cursor-pointer"
              >
                Acknowledge & Respond
              </button>
            )}
            {incident.status === 'responding' && (
              <div className="space-y-3">
                <div className="bg-purple-50 text-purple-800 p-4 rounded-lg border border-purple-200 text-center font-medium">
                  Status: Currently Responding to Incident
                </div>
                <button
                  onClick={() => handleUpdate('resolved')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-sm text-lg cursor-pointer"
                >
                  Mark as Resolved
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
