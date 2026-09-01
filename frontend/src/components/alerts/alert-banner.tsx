'use client';

import React, { useState, useEffect } from 'react';
import { IAlert } from '@/shared/types';
import { getAlerts, acknowledgeAlert } from '@/shared/api';
import { useSocket } from '@/shared/hooks';

interface AlertBannerProps {
  siteId?: string | null;
  criticalOnly?: boolean;
}

const SEVERITY_STYLES: Record<string, string> = {
  informational: 'bg-blue-50 border-blue-200 text-blue-900',
  advisory: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  warning: 'bg-orange-50 border-orange-200 text-orange-900',
  critical: 'bg-red-50 text-red-950', // Static (no pulse)
};

const SEVERITY_ICONS: Record<string, string> = {
  informational: 'ℹ️',
  advisory: '⚠️',
  warning: '🔔',
  critical: '🚨',
};

const SEVERITY_BADGE_STYLES: Record<string, string> = {
  informational: 'bg-blue-100 text-blue-800 border border-blue-300',
  advisory: 'bg-yellow-100 text-yellow-800 border border-yellow-400',
  warning: 'bg-orange-100 text-orange-800 border border-orange-300',
  critical: 'bg-red-100 text-red-800 border border-red-300',
};

const SEVERITY_BTN_STYLES: Record<string, string> = {
  informational: 'bg-blue-600 hover:bg-blue-700 border border-blue-700',
  advisory: 'bg-yellow-600 hover:bg-yellow-700 border border-yellow-700',
  warning: 'bg-orange-600 hover:bg-orange-700 border border-orange-700',
  critical: 'bg-red-600 hover:bg-red-700 border border-red-700',
};

const MARCHING_BORDER_COLORS: Record<string, string> = {
  advisory: '#CA8A04',
  critical: '#DC2626',
};

export default function AlertBanner({ siteId, criticalOnly = false }: AlertBannerProps) {
  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const { on, off } = useSocket(siteId || null);

  useEffect(() => {
    if (!siteId) return;

    getAlerts(siteId)
      .then((res) => {
        if (res.success && res.data) {
          setAlerts(res.data.filter((a) => a.status === 'dispatched' || a.status === 'escalated'));
        }
      })
      .catch(console.error);
  }, [siteId]);

  useEffect(() => {
    const handleNewAlert = (alert: unknown) => {
      const a = alert as IAlert;
      if (a && (a.status === 'dispatched' || a.status === 'escalated')) {
        setAlerts((prev) => [a, ...prev.filter((item) => item.id !== a.id)]);
      }
    };

    const handleAckAlert = (data: unknown) => {
      const payload = data as { alertId: string };
      if (payload?.alertId) {
        setAlerts((prev) => prev.filter((a) => a.id !== payload.alertId));
      }
    };

    on('alert:new', handleNewAlert);
    on('alert:acknowledged', handleAckAlert);

    return () => {
      off('alert:new', handleNewAlert);
      off('alert:acknowledged', handleAckAlert);
    };
  }, [on, off]);

  const handleAcknowledge = async (id: string) => {
    try {
      const res = await acknowledgeAlert(id);
      if (res.success) {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error('Failed to acknowledge alert', err);
    }
  };

  // 1. Filter by severity if criticalOnly is enabled (non-alert dashboard pages)
  const severityFiltered = criticalOnly
    ? alerts.filter((a) => a.severity === 'critical')
    : alerts;

  // 2. Deduplicate: only show the single newest active alert per zone so repeated runs don't stack duplicates
  const displayedAlerts: IAlert[] = [];
  const seenKeys = new Set<string>();

  for (const alert of severityFiltered) {
    const dedupeKey = alert.targetZoneId ? `${alert.targetZoneId}-${alert.severity}` : alert.title;
    if (!seenKeys.has(dedupeKey)) {
      seenKeys.add(dedupeKey);
      displayedAlerts.push(alert);
    }
  }

  if (displayedAlerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
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

      {alerts.map((alert) => {
        const isCritical = alert.severity === 'critical';
        const isHighlighted = isCritical || alert.severity === 'advisory';

        return (
          <div
            key={alert.id}
            className={`relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl shadow-sm ${
              SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.informational
            } ${!isHighlighted ? 'border' : ''}`}
          >
            {/* Animated Marching Dashed Border for Critical & Advisory Alerts */}
            {isHighlighted && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-xl overflow-visible">
                <rect
                  x="1"
                  y="1"
                  width="calc(100% - 2px)"
                  height="calc(100% - 2px)"
                  rx="10"
                  fill="none"
                  stroke={MARCHING_BORDER_COLORS[alert.severity] || '#DC2626'}
                  strokeWidth="2.5"
                  className="marching-border"
                />
              </svg>
            )}

            <div className="relative z-10 flex items-start gap-3">
              <span className="text-2xl mt-0.5">{SEVERITY_ICONS[alert.severity] || 'ℹ️'}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-base">{alert.title}</h3>
                  <span className={`text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${SEVERITY_BADGE_STYLES[alert.severity] || SEVERITY_BADGE_STYLES.informational}`}>
                    {alert.severity}
                  </span>
                  {alert.targetZoneName && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/70 border border-current/20">
                      Zone: {alert.targetZoneName}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium opacity-90">{alert.message}</p>
                {alert.messageHi && (
                  <p className="text-sm opacity-80 mt-1 italic font-sans">{alert.messageHi}</p>
                )}

                <div className="flex items-center gap-2 mt-2">
                  {alert.channels.map((channel) => (
                    <span
                      key={channel}
                      className="text-[10px] uppercase bg-black/5 px-1.5 py-0.5 rounded text-current font-semibold"
                    >
                      {channel.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleAcknowledge(alert.id)}
              className={`relative z-10 shrink-0 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-all text-sm hover:shadow-md ${SEVERITY_BTN_STYLES[alert.severity] || SEVERITY_BTN_STYLES.critical}`}
            >
              Acknowledge
            </button>
          </div>
        );
      })}
    </div>
  );
}
