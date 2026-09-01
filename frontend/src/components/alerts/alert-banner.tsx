'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { IAlert } from '@/shared/types';
import { getAlerts, acknowledgeAlert } from '@/shared/api';
import { useSocket } from '@/shared/hooks';

interface AlertBannerProps {
  siteId?: string | null;
}

const SEVERITY_STYLES: Record<string, string> = {
  informational: 'bg-blue-50 border border-blue-200 text-blue-900',
  advisory: 'bg-yellow-50 border border-yellow-300 text-yellow-950',
  warning: 'bg-orange-50 border border-orange-300 text-orange-950',
  critical: 'bg-red-50 text-red-950',
};

const SEVERITY_ICONS: Record<string, string> = {
  informational: 'ℹ️',
  advisory: '⚠️',
  warning: '🔔',
  critical: '🚨',
};

const SEVERITY_BADGE_STYLES: Record<string, string> = {
  informational: 'bg-blue-100 text-blue-800 border border-blue-300',
  advisory: 'bg-yellow-100 text-yellow-900 border border-yellow-400',
  warning: 'bg-orange-100 text-orange-900 border border-orange-300',
  critical: 'bg-red-100 text-red-800 border border-red-300',
};

const SEVERITY_BTN_STYLES: Record<string, string> = {
  informational: 'bg-blue-600 hover:bg-blue-700 border border-blue-700',
  advisory: 'bg-yellow-600 hover:bg-yellow-700 border border-yellow-700',
  warning: 'bg-orange-600 hover:bg-orange-700 border border-orange-700',
  critical: 'bg-red-600 hover:bg-red-700 border border-red-700',
};

const MARCHING_BORDER_COLORS: Record<string, string> = {
  advisory: '#CA8A04', // Yellow-600 for moderate
  critical: '#DC2626', // Red-600 for critical
};

export default function AlertBanner({ siteId }: AlertBannerProps) {
  const pathname = usePathname();
  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const { on, off } = useSocket(siteId || null);

  const isAlertsPage = pathname === '/dashboard/alerts';

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

  // Real-time WebSocket listener: receive live alerts without page reload
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

  // Visibility Filter:
  // - On /dashboard/alerts: Show both CRITICAL (Red) and MODERATE / ADVISORY (Yellow) alerts.
  // - On all other pages: Show ONLY CRITICAL (Red) emergency alerts.
  const visibleAlerts = alerts.filter((alert) => {
    const sev = alert.severity?.toLowerCase();
    if (sev === 'critical') return true;
    if (isAlertsPage && (sev === 'advisory' || sev === 'moderate')) return true;
    return false;
  });

  // Deduplicate active alerts by zone so repeated demo runs do not stack duplicate banners
  const displayedAlerts: IAlert[] = [];
  const seenKeys = new Set<string>();

  for (const alert of visibleAlerts) {
    const dedupeKey = alert.targetZoneId ? `${alert.targetZoneId}-${alert.severity}` : alert.id;
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

      {displayedAlerts.map((alert) => {
        const sev = alert.severity?.toLowerCase() || 'critical';
        const isCritical = sev === 'critical';
        const isAdvisory = sev === 'advisory' || sev === 'moderate';
        const hasMarchingBorder = isCritical || isAdvisory;
        const borderColor = MARCHING_BORDER_COLORS[isCritical ? 'critical' : 'advisory'] || '#DC2626';

        return (
          <div
            key={alert.id}
            className={`relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl shadow-sm ${
              SEVERITY_STYLES[sev] || SEVERITY_STYLES.critical
            }`}
          >
            {/* Animated Marching Dashed Border: Red for Critical, Yellow for Moderate */}
            {hasMarchingBorder && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-xl overflow-visible">
                <rect
                  x="1"
                  y="1"
                  width="calc(100% - 2px)"
                  height="calc(100% - 2px)"
                  rx="10"
                  fill="none"
                  stroke={borderColor}
                  strokeWidth="2.5"
                  className="marching-border"
                />
              </svg>
            )}

            <div className="relative z-10 flex items-start gap-3">
              <span className="text-2xl mt-0.5">{SEVERITY_ICONS[sev] || '⚠️'}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-base">{alert.title}</h3>
                  <span
                    className={`text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                      SEVERITY_BADGE_STYLES[sev] || SEVERITY_BADGE_STYLES.critical
                    }`}
                  >
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
              className={`relative z-10 shrink-0 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-all text-sm hover:shadow-md cursor-pointer ${
                SEVERITY_BTN_STYLES[sev] || SEVERITY_BTN_STYLES.critical
              }`}
            >
              Acknowledge
            </button>
          </div>
        );
      })}
    </div>
  );
}
