'use client';

import React from 'react';
import { IIncident } from '@/shared/types';
import { updateIncidentStatus } from '@/shared/api';

interface NavigationPanelProps {
  incident: IIncident | null;
  onStatusUpdate?: (id: string, status: 'responding' | 'resolved') => void;
}

function getLatLng(location: any): { lat: number; lng: number } | null {
  if (!location) return null;
  if (location.latitude !== undefined && location.longitude !== undefined) {
    return { lat: Number(location.latitude), lng: Number(location.longitude) };
  }
  if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    return { lat: Number(location.coordinates[1]), lng: Number(location.coordinates[0]) };
  }
  if (location.lat !== undefined && location.lng !== undefined) {
    return { lat: Number(location.lat), lng: Number(location.lng) };
  }
  return null;
}

export default function NavigationPanel({ incident, onStatusUpdate }: NavigationPanelProps) {
  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-on-surface-variant bg-surface-container-low p-8">
        <span className="material-symbols-outlined text-5xl mb-3 text-secondary">explore</span>
        <h3 className="font-headline-sm text-base font-bold text-on-surface">Select an Incident</h3>
        <p className="text-center text-xs font-telemetry-md mt-1 max-w-sm">
          Select an active dispatch from the roster on the left to inspect telemetry, live GPS coordinates, and initiate navigation.
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

  const latLng = getLatLng(incident.location);
  const mapUrl = latLng
    ? `https://www.google.com/maps/search/?api=1&query=${latLng.lat},${latLng.lng}`
    : '#';

  const isCritical = incident.severity === 'critical';

  return (
    <div className="flex flex-col h-full bg-surface-container-low overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-outline-variant bg-surface flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-label-caps font-bold uppercase ${
            isCritical
              ? 'bg-error/20 border border-error text-error'
              : 'bg-primary-container/20 border border-primary-container text-primary'
          }`}>
            {incident.severity} Priority
          </span>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-label-caps font-bold uppercase bg-surface-container border border-border-subtle text-on-surface">
            {incident.status}
          </span>
          <span className="font-telemetry-md text-[10px] text-on-surface-variant ml-auto">
            ID: {incident.id}
          </span>
        </div>
        <h2 className="font-headline-md text-xl font-bold text-on-surface tracking-tight">
          {incident.title || incident.incidentType?.replace('_', ' ')}
        </h2>
        <p className="text-on-surface-variant font-telemetry-md text-xs flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-primary">location_on</span>
          <span>Zone: {incident.zoneName || incident.zoneId || 'Site Wide'}</span>
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Incident Details Card */}
        <div className="bg-surface p-4 rounded-lg hud-border shadow-xs">
          <h3 className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider mb-2 font-bold">
            Tactical Briefing & Description
          </h3>
          <p className="text-on-surface font-body-base text-xs leading-relaxed">
            {incident.description || 'No additional telemetry notes provided.'}
          </p>
          <div className="mt-4 flex gap-6 text-xs font-telemetry-md border-t border-border-subtle pt-3 text-on-surface-variant">
            <div>
              <span className="block text-[10px] font-label-caps uppercase text-on-surface-variant/70">Detection Source</span>
              <span className="font-bold text-on-surface uppercase">{incident.detectionSource || 'System AI'}</span>
            </div>
            {incident.confidenceScore && (
              <div>
                <span className="block text-[10px] font-label-caps uppercase text-on-surface-variant/70">AI Confidence</span>
                <span className="font-bold text-primary">{Math.round(incident.confidenceScore * 100)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* GPS Coordinates Card */}
        <div className="bg-surface p-4 rounded-lg hud-border shadow-xs flex flex-col gap-3">
          <h3 className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">
            Location & GPS Waypoints
          </h3>
          {latLng ? (
            <div className="text-xs font-telemetry-md text-on-surface bg-surface-container p-2.5 rounded border border-border-subtle font-mono">
              Latitude: {latLng.lat.toFixed(6)}° N, Longitude: {latLng.lng.toFixed(6)}° E
            </div>
          ) : (
            <p className="text-xs font-telemetry-md text-on-surface-variant">GPS coordinates not available.</p>
          )}

          {latLng && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary hover:bg-primary-container text-white font-body-bold text-xs py-2.5 px-4 rounded text-center transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">navigation</span>
              Open Real-Time Turn-by-Turn in Google Maps
            </a>
          )}
        </div>

        {/* Action Dispatch Card */}
        <div className="bg-surface p-4 rounded-lg hud-border shadow-xs">
          <h3 className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider mb-3 font-bold">
            Field Unit Status Control
          </h3>
          <div>
            {incident.status === 'verified' && (
              <button
                onClick={() => handleUpdate('responding')}
                className="w-full bg-error hover:bg-error/90 text-white font-body-bold py-2.5 px-4 rounded text-xs transition-colors shadow-md shadow-error/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">directions_run</span>
                Acknowledge & Deploy Unit to Scene
              </button>
            )}
            {incident.status === 'responding' && (
              <div className="space-y-3">
                <div className="bg-primary/10 border border-primary/30 text-primary p-3 rounded text-center font-telemetry-md text-xs font-bold flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  STATUS: UNIT EN ROUTE TO SECTOR
                </div>
                <button
                  onClick={() => handleUpdate('resolved')}
                  className="w-full bg-status-nominal hover:bg-emerald-700 text-white font-body-bold py-2.5 px-4 rounded text-xs transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Mark Incident as Resolved
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

