'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { IAlert, ISosRequest, AlertStatus, SosStatus } from '@/shared/types';
import {
  getAlerts,
  acknowledgeAlert as apiAcknowledgeAlert,
  getSosRequests,
  updateSosStatus as apiUpdateSosStatus,
} from '@/shared/api';
import { useSocket, useAuth } from '@/shared/hooks';

interface NotificationContextValue {
  // Alerts
  alerts: IAlert[];
  unreadAlertsCount: number;
  acknowledgeAlert: (alertId: string) => Promise<boolean>;
  refreshAlerts: () => Promise<void>;

  // SOS Distress Requests
  sosRequests: ISosRequest[];
  unreadSosCount: number;
  updateSosStatus: (sosId: string, status: string) => Promise<boolean>;
  acknowledgeSos: (sosId: string) => Promise<boolean>;
  refreshSos: () => Promise<void>;

  loading: boolean;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const siteId = user?.siteId || '0275fd8b-81a2-4513-bdc5-9c4d27aae375';
  const { on, off } = useSocket(siteId);

  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const [sosRequests, setSosRequests] = useState<ISosRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch initial alerts from database/API
  const refreshAlerts = useCallback(async () => {
    try {
      const res = await getAlerts(siteId);
      if (res?.success && Array.isArray(res.data)) {
        setAlerts(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  }, [siteId]);

  // Fetch initial SOS requests from database/API
  const refreshSos = useCallback(async () => {
    try {
      const res = await getSosRequests(siteId);
      if (res?.success && Array.isArray(res.data)) {
        setSosRequests(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch SOS requests:', err);
    }
  }, [siteId]);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([refreshAlerts(), refreshSos()]).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [refreshAlerts, refreshSos]);

  // Real-time WebSocket event handling for alerts and SOS
  useEffect(() => {
    const handleNewAlert = (alertData: unknown) => {
      const a = alertData as IAlert;
      if (a && a.id) {
        setAlerts((prev) => [a, ...prev.filter((item) => item.id !== a.id)]);
      }
    };

    const handleAckAlert = (data: unknown) => {
      const payload = data as { alertId: string };
      if (payload?.alertId) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === payload.alertId ? { ...a, status: AlertStatus.ACKNOWLEDGED } : a))
        );
      }
    };

    const handleEscalateAlert = (data: unknown) => {
      const payload = data as { alertId: string; status: AlertStatus };
      if (payload?.alertId) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === payload.alertId ? { ...a, status: AlertStatus.ESCALATED } : a))
        );
      }
    };

    const handleNewSos = (sosData: unknown) => {
      const sos = sosData as any;
      if (sos && sos.id) {
        const normalizedSos: ISosRequest = {
          id: sos.id,
          siteId: sos.siteId || null,
          location: sos.location || null,
          message: sos.message || null,
          contactPhone: sos.contactPhone || null,
          status: (sos.status as SosStatus) || SosStatus.PENDING,
          assignedTo: sos.assignedTo || null,
          createdAt: sos.createdAt || new Date().toISOString(),
          updatedAt: sos.updatedAt || new Date().toISOString(),
        };
        setSosRequests((prev) => [normalizedSos, ...prev.filter((item) => item.id !== sos.id)]);
      }
    };

    const handleSosStatusUpdate = (data: unknown) => {
      const payload = data as { id?: string; sosId?: string; status: string; assignedTo?: string };
      const targetId = payload?.id || payload?.sosId;
      if (targetId && payload?.status) {
        setSosRequests((prev) =>
          prev.map((s) =>
            s.id === targetId
              ? {
                  ...s,
                  status: payload.status as SosStatus,
                  assignedTo: payload.assignedTo !== undefined ? payload.assignedTo : s.assignedTo,
                }
              : s
          )
        );
      }
    };

    on('alert:new', handleNewAlert);
    on('alert:acknowledged', handleAckAlert);
    on('alert:escalated', handleEscalateAlert);
    on('sos:new', handleNewSos);
    on('sos:status:update', handleSosStatusUpdate);

    return () => {
      off('alert:new', handleNewAlert);
      off('alert:acknowledged', handleAckAlert);
      off('alert:escalated', handleEscalateAlert);
      off('sos:new', handleNewSos);
      off('sos:status:update', handleSosStatusUpdate);
    };
  }, [on, off]);

  // Acknowledge an alert: updates status to ACKNOWLEDGED in backend & local state
  const acknowledgeAlert = useCallback(async (alertId: string): Promise<boolean> => {
    try {
      const res = await apiAcknowledgeAlert(alertId);
      if (res?.success) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, status: AlertStatus.ACKNOWLEDGED } : a))
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      // Optimistic update fallback
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: AlertStatus.ACKNOWLEDGED } : a))
      );
      return true;
    }
  }, []);

  // Update SOS status (e.g. acknowledge, responding, resolved)
  const updateSosStatus = useCallback(async (sosId: string, status: string): Promise<boolean> => {
    try {
      const res = await apiUpdateSosStatus(sosId, status);
      if (res?.success) {
        setSosRequests((prev) =>
          prev.map((s) => (s.id === sosId ? { ...s, status: status as SosStatus } : s))
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update SOS status:', err);
      setSosRequests((prev) =>
        prev.map((s) => (s.id === sosId ? { ...s, status: status as SosStatus } : s))
      );
      return true;
    }
  }, []);

  // Convenience acknowledge SOS
  const acknowledgeSos = useCallback(
    async (sosId: string) => {
      return updateSosStatus(sosId, 'acknowledged');
    },
    [updateSosStatus]
  );

  // Derived unread counts directly from underlying data model:
  // - Unread Alerts: any alert whose status is NOT acknowledged, NOT resolved, and NOT expired.
  const unreadAlertsCount = useMemo(() => {
    return alerts.filter((alert) => {
      const st = alert.status?.toLowerCase();
      return st === 'dispatched' || st === 'escalated';
    }).length;
  }, [alerts]);

  // - Unread SOS: any SOS request whose status is 'pending' (not yet acknowledged, responding, or resolved).
  const unreadSosCount = useMemo(() => {
    return sosRequests.filter((sos) => {
      const st = sos.status?.toLowerCase();
      return st === 'pending';
    }).length;
  }, [sosRequests]);

  const value = useMemo(
    () => ({
      alerts,
      unreadAlertsCount,
      acknowledgeAlert,
      refreshAlerts,
      sosRequests,
      unreadSosCount,
      updateSosStatus,
      acknowledgeSos,
      refreshSos,
      loading,
    }),
    [
      alerts,
      unreadAlertsCount,
      acknowledgeAlert,
      refreshAlerts,
      sosRequests,
      unreadSosCount,
      updateSosStatus,
      acknowledgeSos,
      refreshSos,
      loading,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
