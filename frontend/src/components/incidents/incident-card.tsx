'use client';

import React from 'react';
import { IIncident } from '@/shared/types';

interface IncidentCardProps {
  incident: IIncident;
  onVerify?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onClick?: (id: string) => void;
  onTitleClick?: (incident: IIncident) => void;
  showActions?: boolean;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'border-l-red-600',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-green-500',
};

const SEVERITY_BADGE_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

const STATUS_COLORS: Record<string, string> = {
  flagged: 'bg-slate-100 text-slate-800',
  verified: 'bg-blue-100 text-blue-800',
  dismissed: 'bg-zinc-100 text-zinc-600',
  responding: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
};

const TYPE_LABELS: Record<string, string> = {
  crush_precursor: 'Crush Precursor',
  medical_emergency: 'Medical Emergency',
  geofence_breach: 'Geofence Breach',
  environmental_hazard: 'Environmental Hazard',
  stampede: 'Stampede Warning',
  fire: 'Fire Alert',
  other: 'Incident',
};

export default function IncidentCard({
  incident,
  onVerify,
  onDismiss,
  onClick,
  onTitleClick,
  showActions = true,
}: IncidentCardProps) {
  const isUserReported = incident.detectionSource !== 'ai';
  const borderClass = SEVERITY_COLORS[incident.severity] || 'border-l-slate-400';
  const badgeClass = SEVERITY_BADGE_COLORS[incident.severity] || 'bg-slate-100 text-slate-800 border-slate-200';
  const statusClass = STATUS_COLORS[incident.status] || 'bg-slate-100 text-slate-800';

  const typeLabel = TYPE_LABELS[incident.incidentType] || incident.incidentType?.replace('_', ' ');

  const timeAgo = incident.createdAt
    ? new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  return (
    <div
      data-incident-card="true"
      onClick={() => onClick?.(incident.id)}
      className={`bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 ${borderClass} p-4 flex flex-col gap-3 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : ''
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1.5 flex-1 pr-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeClass}`}>
              {incident.severity}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusClass}`}>
              {incident.status}
            </span>
            {isUserReported && (
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                <span>📷</span> User Evidence
              </span>
            )}
          </div>

          {/* Title: Clickable if User Reported, Static if AI Reported */}
          {isUserReported ? (
            <h3
              data-incident-title="true"
              onClick={(e) => {
                if (onTitleClick) {
                  e.stopPropagation();
                  onTitleClick(incident);
                }
              }}
              className={`font-bold text-slate-900 text-lg ${
                onTitleClick
                  ? 'cursor-pointer hover:text-indigo-600 hover:underline transition-colors flex items-center gap-1.5'
                  : ''
              }`}
            >
              <span>{incident.title || typeLabel}</span>
              {onTitleClick && <span className="text-xs text-indigo-500 font-normal">↗</span>}
            </h3>
          ) : (
            <h3 className="font-bold text-slate-900 text-lg cursor-default select-none">
              {incident.title || typeLabel}
            </h3>
          )}
        </div>
        <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{timeAgo}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">📍</span>
          <span className="font-medium truncate">{incident.zoneName || incident.zoneId || 'Site Wide'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">🔍</span>
          <span className="font-medium uppercase">{incident.detectionSource || 'System'}</span>
        </div>
      </div>

      {typeof incident.confidenceScore === 'number' && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-500 w-20">Confidence</span>
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                incident.confidenceScore > 0.8 ? 'bg-red-500' : incident.confidenceScore > 0.5 ? 'bg-orange-400' : 'bg-slate-400'
              }`}
              style={{ width: `${Math.round(incident.confidenceScore * 100)}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-600">{Math.round(incident.confidenceScore * 100)}%</span>
        </div>
      )}

      {showActions && incident.status === 'flagged' && (
        <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVerify?.(incident.id);
            }}
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold py-2 px-3 rounded text-sm transition-colors shadow-sm"
          >
            Verify Incident
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss?.(incident.id);
            }}
            className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold py-2 px-3 rounded text-sm transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {showActions && (incident.status === 'verified' || incident.status === 'responding') && (
        <div className="mt-2 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
          <span>Active incident</span>
          <span className="font-semibold capitalize text-indigo-600">Status: {incident.status}</span>
        </div>
      )}

      {!showActions && (
        <div className="mt-1 pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
          <span>Click to view details & verify</span>
          <span className="text-indigo-600 font-medium">Manage →</span>
        </div>
      )}
    </div>
  );
}
