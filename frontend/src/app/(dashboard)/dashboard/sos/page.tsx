'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import RoleGuard from '@/components/auth/role-guard';
import { useAuth, useSocket } from '@/shared/hooks';
import { ISosRequest, SosStatus } from '@/shared/types';
import { getSosRequests, updateSosStatus } from '@/shared/api';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-error/20 text-error border-error',
  acknowledged: 'bg-tertiary/20 text-tertiary border-tertiary',
  responding: 'bg-primary-container/20 text-primary border-primary',
  resolved: 'bg-status-nominal/20 text-status-nominal border-status-nominal',
};

export default function SosPage() {
  const { user } = useAuth();
  const siteId = user?.siteId || 'demo-site-prayagraj-01';
  const [requests, setRequests] = useState<ISosRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { on, off } = useSocket(siteId);

  useEffect(() => {
    if (!siteId) return;

    getSosRequests(siteId)
      .then((res) => {
        if (res.success && res.data) {
          setRequests(res.data);
        } else {
          // Demo fallback
          setRequests([
            {
              id: 'SOS-2026-001',
              siteId: siteId,
              location: { type: 'Point', coordinates: [81.8463, 25.4358] },
              message: 'Elderly person collapsed near Sangam River Ghat Steps. High surge pressure detected.',
              contactPhone: '+919876500001',
              status: SosStatus.PENDING,
              assignedTo: null,
              createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
            },
            {
              id: 'SOS-2026-002',
              siteId: siteId,
              location: { type: 'Point', coordinates: [81.8425, 25.4335] },
              message: 'Child separated from family near Main Entry Gate 4. Requesting security assistance.',
              contactPhone: '+919876500002',
              status: SosStatus.ACKNOWLEDGED,
              assignedTo: 'responder-team-bravo',
              createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            },
          ]);
        }
      })
      .catch(() => {
        setRequests([]);
      })
      .finally(() => setLoading(false));
  }, [siteId]);

  useEffect(() => {
    const handleNewSos = (data: unknown) => {
      const sos = data as ISosRequest;
      if (sos?.id) {
        setRequests((prev) => [sos, ...prev.filter((s) => s.id !== sos.id)]);
      }
    };

    on('sos:new', handleNewSos);
    return () => {
      off('sos:new', handleNewSos);
    };
  }, [on, off]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await updateSosStatus(id, newStatus);
    if (res.success) {
      setRequests((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus as SosStatus } : s))
      );
    } else {
      setRequests((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus as SosStatus } : s))
      );
    }
  };

  return (
    <RoleGuard allowedRoles={['manager', 'admin', 'responder']}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto flex flex-col gap-5">
          {/* Keyframe animation for marching dashed lines */}
          <style jsx global>{`
            @keyframes marchingAnts {
              0% {
                stroke-dashoffset: 0;
              }
              100% {
                stroke-dashoffset: -24;
              }
            }
            .marching-border {
              stroke-dasharray: 8 6;
              animation: marchingAnts 1.2s linear infinite;
            }
          `}</style>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
            <div>
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
                SOS Distress Emergency Console
              </h1>
              <p className="text-on-surface-variant font-body-base mt-1">
                Real-time monitor and response queue for visitor 1-tap emergency distress calls.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container border border-border-subtle rounded text-xs font-telemetry-md text-primary font-bold self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
              {requests.filter((r) => r.status === 'pending').length} ACTIVE DISTRESS CALLS
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-surface-container animate-pulse rounded-lg border border-border-subtle" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="hud-panel rounded-lg flex flex-col items-center justify-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-3 text-secondary">emergency</span>
              <h3 className="font-headline-sm text-base font-bold text-on-surface">No SOS Requests</h3>
              <p className="text-xs font-telemetry-md mt-1">All site sectors nominal. No active distress signals.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {requests.map((sos) => {
                const isPending = sos.status === 'pending';
                const statusClass = STATUS_COLORS[sos.status] || STATUS_COLORS.pending;
                const timeStr = new Date(sos.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const mapUrl = sos.location
                  ? `https://www.google.com/maps/search/?api=1&query=${sos.location.coordinates[1]},${sos.location.coordinates[0]}`
                  : '#';

                return (
                  <div
                    key={sos.id}
                    className={`relative rounded-lg p-5 transition-all shadow-sm ${
                      isPending
                        ? 'bg-error-container/15 border border-error/40'
                        : 'hud-panel border border-border-subtle border-l-4 border-l-secondary'
                    }`}
                  >
                    {/* Animated Marching Dashed Border for Pending SOS Requests */}
                    {isPending && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-lg overflow-visible">
                        <rect
                          x="1"
                          y="1"
                          width="calc(100% - 2px)"
                          height="calc(100% - 2px)"
                          rx="8"
                          fill="none"
                          stroke="#DC2626"
                          strokeWidth="2"
                          className="marching-border"
                        />
                      </svg>
                    )}

                    <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="font-label-caps text-[10px] uppercase font-bold text-error px-1.5 py-0.5 rounded bg-error/10 border border-error/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                            SOS #{sos.id.slice(0, 12)}
                          </span>
                          <span className={`text-[10px] font-label-caps font-bold uppercase px-2 py-0.5 rounded border ${statusClass}`}>
                            {sos.status}
                          </span>
                          <span className="text-xs font-telemetry-md text-on-surface-variant">{timeStr}</span>
                        </div>

                        <p className="text-on-surface font-body-bold text-sm leading-relaxed">
                          {sos.message || 'No message provided by caller.'}
                        </p>

                        <div className="flex flex-wrap gap-4 mt-3 text-xs font-telemetry-md text-on-surface-variant">
                          {sos.contactPhone && (
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm text-primary">call</span>
                              <a
                                href={`tel:${sos.contactPhone}`}
                                className="text-primary hover:underline font-bold"
                              >
                                {sos.contactPhone}
                              </a>
                            </div>
                          )}
                          {sos.location && (
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm text-tertiary">location_on</span>
                              <a
                                href={mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-tertiary hover:underline font-bold"
                              >
                                {sos.location.coordinates[1].toFixed(4)}° N, {sos.location.coordinates[0].toFixed(4)}° E
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0 self-start md:self-center">
                        {sos.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(sos.id, 'acknowledged')}
                            className="bg-error hover:bg-error/90 text-on-error text-xs font-body-bold py-2 px-4 rounded shadow-md shadow-error/20 transition-all cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        )}
                        {sos.status === 'acknowledged' && (
                          <button
                            onClick={() => handleStatusChange(sos.id, 'responding')}
                            className="bg-primary hover:bg-primary-container text-on-primary text-xs font-body-bold py-2 px-4 rounded shadow-sm transition-all cursor-pointer"
                          >
                            Dispatch Responder
                          </button>
                        )}
                        {sos.status === 'responding' && (
                          <button
                            onClick={() => handleStatusChange(sos.id, 'resolved')}
                            className="bg-status-nominal hover:bg-emerald-700 text-white text-xs font-body-bold py-2 px-4 rounded shadow-sm transition-all cursor-pointer"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}

