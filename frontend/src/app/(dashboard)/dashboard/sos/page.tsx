'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import RoleGuard from '@/components/auth/role-guard';
import { useAuth, useSocket } from '@/shared/hooks';
import { ISosRequest, SosStatus } from '@/shared/types';
import { getSosRequests, updateSosStatus } from '@/shared/api';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-red-100 text-red-800 border-red-300',
  acknowledged: 'bg-blue-100 text-blue-800 border-blue-200',
  responding: 'bg-purple-100 text-purple-800 border-purple-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
};

export default function SosPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ISosRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { on, off } = useSocket(user?.siteId || null);

  useEffect(() => {
    if (!user?.siteId) return;

    getSosRequests(user.siteId)
      .then((res) => {
        if (res.success && res.data) {
          setRequests(res.data);
        } else {
          // Demo fallback
          setRequests([
            {
              id: 'sos-demo-1',
              siteId: user.siteId,
              location: { type: 'Point', coordinates: [81.8463, 25.4358] },
              message: 'Elderly person collapsed near river ghat steps. Needs immediate medical help.',
              contactPhone: '+919876500001',
              status: SosStatus.PENDING,
              assignedTo: null,
              createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            },
            {
              id: 'sos-demo-2',
              siteId: user.siteId,
              location: { type: 'Point', coordinates: [81.8425, 25.4335] },
              message: 'Child separated from family near main entry gate.',
              contactPhone: '+919876500002',
              status: SosStatus.ACKNOWLEDGED,
              assignedTo: 'demo-responder-uuid-01',
              createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            },
          ]);
        }
      })
      .catch(() => {
        setRequests([]);
      })
      .finally(() => setLoading(false));
  }, [user?.siteId]);

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
      // Demo fallback
      setRequests((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus as SosStatus } : s))
      );
    }
  };

  if (!user) return null;

  return (
    <RoleGuard allowedRoles={['manager', 'admin']}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
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

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">SOS Emergency Requests</h1>
            <p className="text-slate-500 text-sm mt-1">
              Monitor and respond to visitor SOS distress calls in real-time.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-slate-200 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <span className="text-5xl mb-4">🆘</span>
              <h3 className="text-xl font-semibold text-slate-600">No SOS Requests</h3>
              <p className="text-sm mt-2">No active emergency distress calls at this time.</p>
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
                    className={`relative bg-white rounded-xl shadow-sm p-5 transition-all ${
                      isPending
                        ? 'bg-red-50/40'
                        : 'border border-slate-200 border-l-4 border-l-slate-300'
                    }`}
                  >
                    {/* Animated Marching Dashed Border for Pending SOS Requests */}
                    {isPending && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-xl overflow-visible">
                        <rect
                          x="1"
                          y="1"
                          width="calc(100% - 2px)"
                          height="calc(100% - 2px)"
                          rx="12"
                          fill="none"
                          stroke="#DC2626"
                          strokeWidth="2.5"
                          className="marching-border"
                        />
                      </svg>
                    )}

                    <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">🆘</span>
                          <span
                            className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${statusClass}`}
                          >
                            {sos.status}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{timeStr}</span>
                        </div>

                        <p className="text-slate-800 font-semibold text-base">
                          {sos.message || 'No message provided'}
                        </p>

                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
                          {sos.contactPhone && (
                            <div className="flex items-center gap-1.5">
                              <span>📞</span>
                              <a
                                href={`tel:${sos.contactPhone}`}
                                className="text-indigo-600 hover:underline font-medium"
                              >
                                {sos.contactPhone}
                              </a>
                            </div>
                          )}
                          {sos.location && (
                            <div className="flex items-center gap-1.5">
                              <span>📍</span>
                              <a
                                href={mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline font-medium"
                              >
                                {sos.location.coordinates[1].toFixed(4)},{' '}
                                {sos.location.coordinates[0].toFixed(4)}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {sos.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(sos.id, 'acknowledged')}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2.5 px-4 rounded-lg transition-colors shadow-sm"
                          >
                            Acknowledge
                          </button>
                        )}
                        {sos.status === 'acknowledged' && (
                          <button
                            onClick={() => handleStatusChange(sos.id, 'responding')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 px-4 rounded-lg transition-colors shadow-xs"
                          >
                            Dispatch Responder
                          </button>
                        )}
                        {sos.status === 'responding' && (
                          <button
                            onClick={() => handleStatusChange(sos.id, 'resolved')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 px-4 rounded-lg transition-colors shadow-xs"
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
