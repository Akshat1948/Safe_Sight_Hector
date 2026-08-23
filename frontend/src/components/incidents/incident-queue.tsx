'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useSocket } from '@/shared/hooks';
import { IIncident, IncidentStatus } from '@/shared/types';
import { getIncidents, verifyIncident } from '@/shared/api';
import IncidentCard from './incident-card';

type FilterType = 'All' | 'Flagged' | 'Verified' | 'Responding' | 'Resolved';

const ACTIVE_FILTER_STYLES: Record<FilterType, string> = {
  All: 'bg-[#102A43] text-white shadow-sm shadow-[#102A43]/30',
  Flagged: 'bg-red-600 text-white shadow-sm shadow-red-600/30',
  Verified: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30',
  Responding: 'bg-purple-600 text-white shadow-sm shadow-purple-600/30',
  Resolved: 'bg-sky-500 text-white shadow-sm shadow-sky-500/30',
};

interface IncidentQueueProps {
  incidents?: IIncident[];
  onIncidentsChange?: React.Dispatch<React.SetStateAction<IIncident[]>>;
  onIncidentClick?: (incident: IIncident) => void;
  onTitleClick?: (incident: IIncident) => void;
  showActions?: boolean;
  onVerify?: (id: string) => Promise<void> | void;
  onDismiss?: (id: string) => Promise<void> | void;
}

export default function IncidentQueue({
  incidents: propIncidents,
  onIncidentsChange,
  onIncidentClick,
  onTitleClick,
  showActions = true,
  onVerify,
  onDismiss,
}: IncidentQueueProps = {}) {
  const { user } = useAuth();
  const siteId = user?.siteId || null;
  const { on, off } = useSocket(siteId);

  const [localIncidents, setLocalIncidents] = useState<IIncident[]>([]);
  const isControlled = propIncidents !== undefined;
  const incidents = isControlled ? propIncidents : localIncidents;
  const setIncidents = isControlled && onIncidentsChange ? onIncidentsChange : setLocalIncidents;

  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('All');

  useEffect(() => {
    if (!siteId) return;

    const fetchIncidents = async () => {
      setLoading(true);
      try {
        const res = await getIncidents(siteId);
        if (res.success && res.data?.incidents) {
          setIncidents(res.data.incidents);
        }
      } catch (err) {
        console.error('Failed to fetch incidents', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, [siteId]);

  useEffect(() => {
    const handleNewIncident = (incident: unknown) => {
      const inc = incident as IIncident;
      if (inc?.id) {
        setIncidents((prev) => [inc, ...prev.filter((item) => item.id !== inc.id)]);
      }
    };

    const handleUpdateIncident = (data: unknown) => {
      const payload = data as { incidentId?: string; id?: string; status?: IncidentStatus };
      const id = payload.incidentId || payload.id;
      if (id) {
        setIncidents((prev) =>
          prev.map((inc) => (inc.id === id ? { ...inc, ...(payload as Partial<IIncident>) } : inc))
        );
      }
    };

    on('incident:new', handleNewIncident);
    on('incident:verified', handleUpdateIncident);
    on('incident:status:update', handleUpdateIncident);

    return () => {
      off('incident:new', handleNewIncident);
      off('incident:verified', handleUpdateIncident);
      off('incident:status:update', handleUpdateIncident);
    };
  }, [on, off]);

  const handleVerify = async (id: string) => {
    try {
      const res = await verifyIncident(id, 'verify');
      if (res.success) {
        setIncidents((prev) =>
          prev.map((inc) => (inc.id === id ? { ...inc, status: IncidentStatus.VERIFIED } : inc))
        );
        onVerify?.(id);
      }
    } catch (err) {
      console.error('Failed to verify incident', err);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      const res = await verifyIncident(id, 'dismiss');
      if (res.success) {
        setIncidents((prev) =>
          prev.map((inc) => (inc.id === id ? { ...inc, status: IncidentStatus.DISMISSED } : inc))
        );
        onDismiss?.(id);
      }
    } catch (err) {
      console.error('Failed to dismiss incident', err);
    }
  };

  const filteredIncidents = useMemo(() => {
    if (filter === 'All') return incidents;
    return incidents.filter((i) => i.status.toLowerCase() === filter.toLowerCase());
  }, [incidents, filter]);

  const counts = useMemo(() => {
    return {
      All: incidents.length,
      Flagged: incidents.filter((i) => i.status === 'flagged').length,
      Verified: incidents.filter((i) => i.status === 'verified').length,
      Responding: incidents.filter((i) => i.status === 'responding').length,
      Resolved: incidents.filter((i) => i.status === 'resolved').length,
    };
  }, [incidents]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Incident Queue</h2>
        <div className="flex flex-wrap gap-2">
          {(['All', 'Flagged', 'Verified', 'Responding', 'Resolved'] as FilterType[]).map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? ACTIVE_FILTER_STYLES[f]
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100/80 shadow-2xs'
                }`}
              >
                {f}{' '}
                <span
                  className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {counts[f]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
            <span className="text-4xl mb-3">📭</span>
            <p className="font-medium">No incidents found</p>
            <p className="text-sm">Everything is quiet right now.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                onVerify={handleVerify}
                onDismiss={handleDismiss}
                onClick={() => onIncidentClick?.(incident)}
                onTitleClick={onTitleClick}
                showActions={showActions}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
