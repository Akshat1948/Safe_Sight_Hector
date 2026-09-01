'use client';

import React, { useState, useEffect } from 'react';
import { IAlert, AlertSeverity, AlertStatus } from '@/shared/types';
import { getAlerts, acknowledgeAlert } from '@/shared/api';
import { useSocket } from '@/shared/hooks';

interface AlertHistoryProps {
  siteId?: string | null;
}

const SEVERITY_BADGES: Record<string, string> = {
  critical: 'bg-status-critical/15 text-status-critical border border-status-critical/30',
  warning: 'bg-status-warning/15 text-status-warning border border-status-warning/30',
  advisory: 'bg-status-warning/10 text-[#ea580c] border border-[#ea580c]/30',
  informational: 'bg-primary/10 text-primary border border-primary/30',
};

const STATUS_BADGES: Record<string, string> = {
  dispatched: 'bg-status-warning/15 text-status-warning border border-status-warning/30',
  escalated: 'bg-status-critical/15 text-status-critical border border-status-critical/30 animate-pulse',
  acknowledged: 'bg-status-nominal/15 text-status-nominal border border-status-nominal/30',
  expired: 'bg-surface-container text-on-surface-variant border border-border-subtle',
};

export default function AlertHistory({ siteId }: AlertHistoryProps) {
  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { on, off } = useSocket(siteId || null);

  const fetchAlerts = () => {
    setLoading(true);
    getAlerts(siteId || undefined)
      .then((res) => {
        if (res.success && res.data) {
          setAlerts(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, [siteId]);

  useEffect(() => {
    const handleNewAlert = (alert: unknown) => {
      const a = alert as IAlert;
      if (a?.id) {
        setAlerts((prev) => [a, ...prev.filter((item) => item.id !== a.id)]);
      }
    };

    const handleAckAlert = (data: unknown) => {
      const payload = data as { alertId: string; acknowledgedBy?: string; acknowledgedAt?: string };
      if (payload?.alertId) {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === payload.alertId
              ? {
                  ...a,
                  status: AlertStatus.ACKNOWLEDGED,
                  acknowledgedBy: payload.acknowledgedBy || 'Operator',
                  acknowledgedAt: payload.acknowledgedAt || new Date().toISOString(),
                }
              : a
          )
        );
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
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: AlertStatus.ACKNOWLEDGED,
                  acknowledgedAt: new Date().toISOString(),
                }
              : a
          )
        );
      }
    } catch (err) {
      console.error('Failed to acknowledge alert', err);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity !== 'all' && alert.severity?.toLowerCase() !== filterSeverity.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        alert.title.toLowerCase().includes(q) ||
        alert.message.toLowerCase().includes(q) ||
        (alert.targetZoneName && alert.targetZoneName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="hud-panel rounded-lg p-5 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <div>
          <h2 className="font-body-bold text-body-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">history_edu</span>
            Broadcast Log & Alert History
          </h2>
          <p className="text-xs text-on-surface-variant font-telemetry-md">
            Complete audit trail of dispatched crowd advisories, push notifications, and evacuation warnings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-xs bg-surface-container border border-border-subtle rounded text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
          />

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-1.5 text-xs bg-surface-container border border-border-subtle rounded text-on-surface focus:outline-none focus:border-primary cursor-pointer font-label-caps uppercase"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="advisory">Advisory</option>
            <option value="informational">Info</option>
          </select>

          <button
            onClick={fetchAlerts}
            title="Refresh history"
            className="p-1.5 bg-surface-container border border-border-subtle rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
          </button>
        </div>
      </div>

      {loading && alerts.length === 0 ? (
        <div className="py-8 text-center text-xs font-telemetry-md text-on-surface-variant flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
          Loading broadcast history...
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="py-8 text-center text-xs font-telemetry-md text-on-surface-variant">
          No broadcast alerts matching current filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider">
                <th className="pb-2.5 font-bold">Severity</th>
                <th className="pb-2.5 font-bold">Title & Message</th>
                <th className="pb-2.5 font-bold">Target Zone</th>
                <th className="pb-2.5 font-bold">Channels</th>
                <th className="pb-2.5 font-bold">Status</th>
                <th className="pb-2.5 font-bold">Dispatched At</th>
                <th className="pb-2.5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-surface-container/50 transition-colors">
                  <td className="py-3 font-label-caps">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${SEVERITY_BADGES[alert.severity?.toLowerCase()] || SEVERITY_BADGES.informational}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="py-3 pr-4 max-w-xs sm:max-w-md">
                    <div className="font-body-bold text-text-main text-xs">{alert.title}</div>
                    <div className="text-on-surface-variant font-body-base text-[11px] truncate mt-0.5" title={alert.message}>
                      {alert.message}
                    </div>
                  </td>
                  <td className="py-3 font-telemetry-md text-text-main">
                    {alert.targetZoneName || 'Site-Wide'}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      {alert.channels.map((ch) => (
                        <span
                          key={ch}
                          className="px-1.5 py-0.5 bg-surface-container border border-border-subtle rounded text-[9px] font-mono text-on-surface-variant uppercase"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 font-label-caps">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_BADGES[alert.status?.toLowerCase()] || STATUS_BADGES.dispatched}`}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="py-3 font-telemetry-md text-on-surface-variant text-[11px]">
                    {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3 text-right">
                    {alert.status !== AlertStatus.ACKNOWLEDGED ? (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-2.5 py-1 bg-primary text-white rounded text-[10px] font-label-caps font-bold hover:bg-primary/90 transition-colors cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    ) : (
                      <span className="text-[10px] text-status-nominal font-telemetry-md font-bold">
                        ✓ Acked
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
