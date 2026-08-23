'use client';

import React, { useState, useEffect } from 'react';
import { IAlert } from '@/shared/types';
import { getAlerts, acknowledgeAlert } from '@/shared/api';
import { useSocket } from '@/shared/hooks';

interface AlertBannerProps {
  siteId?: string | null;
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

export default function AlertBanner({ siteId }: AlertBannerProps) {
  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const { on, off } = useSocket(siteId || null);

  useEffect(() => {
    if (!siteId) return;

    getAlerts(siteId)
      .then((res) => {
        if (res.success && res.data) {
          setAlerts(res.data.filter((a) => a.status === 'dispatched'));
        }
      })
      .catch(console.error);
  }, [siteId]);

  useEffect(() => {
    const handleNewAlert = (alert: unknown) => {
      const a = alert as IAlert;
      if (a && a.status === 'dispatched') {
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

  if (alerts.length === 0) return null;

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

        return (
          <div
            key={alert.id}
            className={`relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl shadow-sm ${
              SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.informational
            } ${!isCritical ? 'border' : ''}`}
          >
            {/* Animated Marching Dashed Border for Critical Alerts */}
            {isCritical && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-xl overflow-visible">
                <rect
                  x="1"
                  y="1"
                  width="calc(100% - 2px)"
                  height="calc(100% - 2px)"
                  rx="10"
                  fill="none"
                  stroke="#DC2626"
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
                  <span className="text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
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
              className="relative z-10 shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm border border-red-700 transition-all text-sm hover:shadow-md"
            >
              Acknowledge
            </button>
          </div>
        );
      })}
    </div>
  );
}
