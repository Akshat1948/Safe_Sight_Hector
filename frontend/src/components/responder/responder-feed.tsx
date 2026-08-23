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
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400 bg-[#F3F4F1]">
        <span className="text-5xl mb-4">✅</span>
        <h3 className="text-xl font-semibold text-slate-600">All Clear</h3>
        <p className="text-center text-sm mt-2">No active emergencies require your attention.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#F3F4F1]">
      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
        Active Dispatches ({incidents.length})
      </h2>
      {incidents.map((incident) => {
        const isSelected = selectedId === incident.id;
        const borderClass = SEVERITY_COLORS[incident.severity] || 'border-l-slate-400';
        const badgeClass = SEVERITY_BADGE_COLORS[incident.severity] || 'bg-slate-100 text-slate-800';
        const timeAgo = incident.createdAt
          ? new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '';

        return (
          <div
            key={incident.id}
            onClick={() => onSelectIncident(incident)}
            className={`cursor-pointer bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 ${borderClass} p-4 transition-all ${
              isSelected ? 'ring-2 ring-indigo-500 shadow-md transform scale-[1.01]' : 'hover:bg-slate-50 hover:shadow-md'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${badgeClass}`}>
                  {incident.severity}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase shadow-2xs ${
                    incident.status?.toLowerCase() === 'verified'
                      ? 'bg-white text-emerald-600 border-emerald-200'
                      : incident.status?.toLowerCase() === 'responding'
                      ? 'bg-white text-purple-600 border-purple-200'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {incident.status}
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">{timeAgo}</span>
            </div>

            <h3 className="font-bold text-slate-800">{incident.title || incident.incidentType?.replace('_', ' ')}</h3>
            <div className="text-sm text-slate-600 mt-1 flex items-center gap-1">
              <span>📍</span> {incident.zoneName || incident.zoneId || 'Site Wide'}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
              {incident.status === 'verified' && (
                <button
                  onClick={(e) => handleStatusUpdate(e, incident.id, 'responding')}
                  className="flex-1 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  Acknowledge & Respond
                </button>
              )}
              {incident.status === 'responding' && (
                <button
                  onClick={(e) => handleStatusUpdate(e, incident.id, 'resolved')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 px-3 rounded transition-colors"
                >
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
