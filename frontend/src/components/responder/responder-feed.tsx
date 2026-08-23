'use client';

import React, { useState, useEffect } from 'react';
import { IIncident, IncidentStatus } from '@/shared/types';
import { getIncidents, updateIncidentStatus } from '@/shared/api';
import { useSocket } from '@/shared/hooks';

interface ResponderFeedProps {
  siteId?: string | null;
  onSelectIncident: (incident: IIncident | null) => void;
  selectedId?: string;
  incidents?: IIncident[];
  onIncidentsChange?: (incidents: IIncident[]) => void;
  onStatusUpdate?: (id: string, newStatus: 'responding' | 'resolved') => void;
}

export default function ResponderFeed({
  siteId,
  onSelectIncident,
  selectedId,
  incidents: controlledIncidents,
  onIncidentsChange,
  onStatusUpdate: controlledStatusUpdate,
}: ResponderFeedProps) {
  const [internalIncidents, setInternalIncidents] = useState<IIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const { on, off } = useSocket(siteId || null);

  const incidents = controlledIncidents !== undefined ? controlledIncidents : internalIncidents;
  const setIncidents = (updater: IIncident[] | ((prev: IIncident[]) => IIncident[])) => {
    if (controlledIncidents !== undefined && onIncidentsChange) {
      const next = typeof updater === 'function' ? updater(controlledIncidents) : updater;
      onIncidentsChange(next);
    } else {
      setInternalIncidents(updater);
    }
  };

  useEffect(() => {
    if (!siteId) return;

    const fetchIncidents = async () => {
      setLoading(true);
      try {
        const res = await getIncidents(siteId);
        if (res.success && res.data?.incidents) {
          setIncidents(res.data.incidents.filter((i) => i.status === 'verified' || i.status === 'responding'));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, [siteId]);

  useEffect(() => {
    const handleUpdate = (updatedData: unknown) => {
      const updated = updatedData as IIncident;
      if (!updated?.id) return;

      if (updated.status === 'verified' || updated.status === 'responding') {
        setIncidents((prev) => {
          const exists = prev.find((i) => i.id === updated.id);
          if (exists) return prev.map((i) => (i.id === updated.id ? updated : i));
          return [updated, ...prev];
        });
      } else {
        setIncidents((prev) => prev.filter((i) => i.id !== updated.id));
      }
    };

    on('incident:verified', handleUpdate);
    on('incident:status:update', handleUpdate);

    return () => {
      off('incident:verified', handleUpdate);
      off('incident:status:update', handleUpdate);
    };
  }, [on, off]);

  const handleStatusUpdate = async (e: React.MouseEvent, id: string, newStatus: 'responding' | 'resolved') => {
    e.stopPropagation();
    if (controlledStatusUpdate) {
      controlledStatusUpdate(id, newStatus);
      return;
    }

    try {
      const res = await updateIncidentStatus(id, newStatus);
      if (res.success) {
        if (newStatus === 'resolved') {
          setIncidents((prev) => prev.filter((i) => i.id !== id));
          if (selectedId === id) onSelectIncident(null);
        } else {
          setIncidents((prev) =>
            prev.map((i) => (i.id === id ? { ...i, status: newStatus as unknown as IncidentStatus } : i))
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-surface-container animate-pulse rounded-lg border border-border-subtle" />
        ))}
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-on-surface-variant">
        <span className="material-symbols-outlined text-5xl mb-3 text-status-nominal">check_circle</span>
        <h3 className="font-headline-sm text-base font-bold text-on-surface">Sector All Clear</h3>
        <p className="text-center text-xs font-telemetry-md mt-1">No active emergency dispatches currently assigned to your team.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
        <h2 className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-bold">
          Active Dispatches ({incidents.length})
        </h2>
        <span className="font-telemetry-md text-[10px] text-primary font-bold">LIVE TELEMETRY</span>
      </div>

      {incidents.map((incident) => {
        const isSelected = selectedId === incident.id;
        const isCritical = incident.severity === 'critical';
        const timeAgo = incident.createdAt
          ? new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '';

        return (
          <div
            key={incident.id}
            onClick={() => onSelectIncident(incident)}
            className={`cursor-pointer rounded-lg p-3.5 transition-all relative overflow-hidden ${
              isSelected
                ? 'bg-surface hud-border border-primary shadow-md ring-1 ring-primary/40'
                : 'bg-surface hud-border hover:border-primary/50 shadow-xs'
            }`}
          >
            {isSelected && (
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            )}

            <div className="flex justify-between items-start mb-2 pl-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] font-label-caps font-bold px-1.5 py-0.5 rounded border uppercase ${
                    isCritical
                      ? 'bg-error/20 text-error border-error'
                      : 'bg-primary-container/20 text-primary border-primary'
                  }`}
                >
                  {incident.severity}
                </span>
                <span className="text-[9px] font-label-caps font-bold px-1.5 py-0.5 rounded border uppercase bg-surface-container text-on-surface border-border-subtle">
                  {incident.status}
                </span>
              </div>
              <span className="text-[10px] font-telemetry-md text-on-surface-variant">{timeAgo}</span>
            </div>

            <h3 className="font-body-bold text-xs text-on-surface pl-1 leading-snug">
              {incident.title || incident.incidentType?.replace('_', ' ')}
            </h3>

            <div className="text-[11px] font-telemetry-md text-on-surface-variant mt-1.5 pl-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-primary">location_on</span>
              <span>{incident.zoneName || incident.zoneId || 'Site Wide'}</span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-border-subtle flex gap-2 pl-1">
              {incident.status === 'verified' && (
                <button
                  onClick={(e) => handleStatusUpdate(e, incident.id, 'responding')}
                  className="flex-1 bg-error hover:bg-error/90 text-white text-[11px] font-body-bold py-1.5 px-3 rounded transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">directions_run</span>
                  Acknowledge & Respond
                </button>
              )}
              {incident.status === 'responding' && (
                <button
                  onClick={(e) => handleStatusUpdate(e, incident.id, 'resolved')}
                  className="flex-1 bg-status-nominal hover:bg-emerald-700 text-white text-[11px] font-body-bold py-1.5 px-3 rounded transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

