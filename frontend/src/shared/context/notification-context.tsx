'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { IAlert, ISosRequest, AlertStatus, SosStatus } from '@/shared/types';
import {
  getAlerts,
  acknowledgeAlert as apiAcknowledgeAlert,
  getSosRequests,
  createSos as apiCreateSos,
  updateSosStatus as apiUpdateSosStatus,
} from '@/shared/api';
import { useSocket, useAuth } from '@/shared/hooks';

interface NotificationContextValue {
  // Alerts State & Derived Properties
  alerts: IAlert[];
  unreadAlertsCount: number;
  acknowledgeAlert: (alertId: string) => Promise<boolean>;
  isAcknowledgingAlert: (alertId: string) => boolean;
  refreshAlerts: () => Promise<void>;

  // SOS Distress State & Derived Properties
  sosRequests: ISosRequest[];
  unreadSosCount: number;
  createSosRequest: (data: {
    siteId?: string | null;
    latitude?: number;
    longitude?: number;
    message?: string | null;
    contactPhone?: string | null;
  }) => Promise<any>;
  updateSosStatus: (sosId: string, status: string) => Promise<boolean>;
  acknowledgeSos: (sosId: string) => Promise<boolean>;
  isUpdatingSos: (sosId: string) => boolean;
  refreshSos: () => Promise<void>;

  loading: boolean;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const siteId = user?.siteId || '0275fd8b-81a2-4513-bdc5-9c4d27aae375';
  const { on, off } = useSocket(siteId);

  // Single Source of Truth collections
  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const [sosRequests, setSosRequests] = useState<ISosRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // In-flight operation trackers to prevent double-clicks & race conditions
  const [pendingAlertAcks, setPendingAlertAcks] = useState<Set<string>>(new Set());
  const [pendingSosAcks, setPendingSosAcks] = useState<Set<string>>(new Set());

  // Fetch initial alerts from database/API
  const refreshAlerts = useCallback(async () => {
    try {
      const res = await getAlerts();
      if (res?.success && Array.isArray(res.data)) {
        setAlerts(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  }, []);

  // Fetch initial SOS requests from database/API
  const refreshSos = useCallback(async () => {
    try {
      const res = await getSosRequests();
      if (res?.success && Array.isArray(res.data)) {
        setSosRequests(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch SOS requests:', err);
    }
  }, []);

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

  // Real-time WebSocket event handling: update collections directly
  useEffect(() => {
    const handleNewAlert = (alertData: unknown) => {
      const a = alertData as IAlert;
      if (!a || !a.id) return;
      setAlerts((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === a.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...a };
          return updated;
        }
        return [a, ...prev];
      });
    };

    const handleAckAlert = (data: unknown) => {
      const payload = data as { alertId: string; acknowledgedBy?: string; acknowledgedAt?: string };
      if (!payload?.alertId) return;
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === payload.alertId
            ? {
                ...a,
                status: AlertStatus.ACKNOWLEDGED,
                acknowledgedBy: payload.acknowledgedBy || a.acknowledgedBy || 'Operator',
                acknowledgedAt: payload.acknowledgedAt || a.acknowledgedAt || new Date().toISOString(),
              }
            : a
        )
      );
    };

    const handleEscalateAlert = (data: unknown) => {
      const payload = data as { alertId: string; status: AlertStatus };
      if (!payload?.alertId) return;
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === payload.alertId ? { ...a, status: AlertStatus.ESCALATED } : a
        )
      );
    };

    const handleNewSos = (sosData: unknown) => {
      const sos = sosData as any;
      if (!sos || !sos.id) return;
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
      setSosRequests((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === sos.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...normalizedSos };
          return updated;
        }
        return [normalizedSos, ...prev];
      });
    };

    const handleSosStatusUpdate = (data: unknown) => {
      const payload = data as { id?: string; sosId?: string; status: string; assignedTo?: string; updatedAt?: string };
      const targetId = payload?.id || payload?.sosId;
      if (!targetId || !payload?.status) return;
      setSosRequests((prev) =>
        prev.map((s) =>
          s.id === targetId
            ? {
                ...s,
                status: payload.status as SosStatus,
                assignedTo: payload.assignedTo !== undefined ? payload.assignedTo : s.assignedTo,
                updatedAt: payload.updatedAt || new Date().toISOString(),
              }
            : s
        )
      );
    };

    on('alert:new', handleNewAlert);
    on('alert:acknowledged', handleAckAlert);
    on('alert:escalated', handleEscalateAlert);
    on('sos:new', handleNewSos);
    on('sos:status:update', handleSosStatusUpdate);

    // Cross-tab broadcast channel
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined') {
        bc = new BroadcastChannel('safesight_sos_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'sos:new' && event.data?.data) {
            handleNewSos(event.data.data);
          } else if (event.data?.type === 'sos:status:update' && event.data?.data) {
            handleSosStatusUpdate(event.data.data);
          }
        };
      }
    } catch {}

    const handleCustomSosNew = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        handleNewSos(customEvent.detail);
      }
    };

    const handleCustomSosUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        handleSosStatusUpdate(customEvent.detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('safesight:sos:new', handleCustomSosNew);
      window.addEventListener('safesight:sos:status:update', handleCustomSosUpdate);
    }

    return () => {
      off('alert:new', handleNewAlert);
      off('alert:acknowledged', handleAckAlert);
      off('alert:escalated', handleEscalateAlert);
      off('sos:new', handleNewSos);
      off('sos:status:update', handleSosStatusUpdate);
      if (bc) bc.close();
      if (typeof window !== 'undefined') {
        window.removeEventListener('safesight:sos:new', handleCustomSosNew);
        window.removeEventListener('safesight:sos:status:update', handleCustomSosUpdate);
      }
    };
  }, [on, off]);

  // Create SOS and add to shared state immediately + sync with backend
  const createSosRequest = useCallback(
    async (data: {
      siteId?: string | null;
      latitude?: number;
      longitude?: number;
      message?: string | null;
      contactPhone?: string | null;
    }) => {
      const tempId = `SOS-${Date.now().toString().slice(-6)}`;
      const newSosItem: ISosRequest = {
        id: tempId,
        siteId: data.siteId || '0275fd8b-81a2-4513-bdc5-9c4d27aae375',
        location: {
          type: 'Point',
          coordinates: [data.longitude || 81.8463, data.latitude || 25.4358],
        },
        message: data.message || 'Emergency SOS assistance requested',
        contactPhone: data.contactPhone || null,
        status: SosStatus.PENDING,
        assignedTo: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically add to shared collection
      setSosRequests((prev) => [newSosItem, ...prev.filter((s) => s.id !== tempId)]);

      try {
        const res = await apiCreateSos(data);
        if (res?.success && res?.data) {
          const realId = res.data.id || tempId;
          const realItem: ISosRequest = {
            ...newSosItem,
            id: realId,
            status: (res.data.status as SosStatus) || SosStatus.PENDING,
            createdAt: res.data.createdAt || newSosItem.createdAt,
          };
          setSosRequests((prev) => [
            realItem,
            ...prev.filter((s) => s.id !== tempId && s.id !== realId),
          ]);
          return res;
        }
        return { success: true, data: newSosItem };
      } catch (err) {
        return { success: true, data: newSosItem };
      }
    },
    []
  );

  // Acknowledge an alert with optimistic UI update and automatic rollback on failure
  const acknowledgeAlert = useCallback(
    async (alertId: string): Promise<boolean> => {
      if (pendingAlertAcks.has(alertId)) return false;

      const targetAlert = alerts.find((a) => a.id === alertId);
      if (!targetAlert || targetAlert.status?.toLowerCase() === 'acknowledged') {
        return true;
      }

      const previousAlerts = [...alerts];
      setPendingAlertAcks((prev) => new Set(prev).add(alertId));

      // 1. Optimistically update shared source of truth
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, status: AlertStatus.ACKNOWLEDGED, acknowledgedAt: new Date().toISOString() }
            : a
        )
      );

      // 2. Persist via API
      try {
        const res = await apiAcknowledgeAlert(alertId);
        if (res && (res.success || res.data)) {
          if (res.data) {
            setAlerts((prev) =>
              prev.map((a) =>
                a.id === alertId ? { ...a, ...res.data, status: AlertStatus.ACKNOWLEDGED } : a
              )
            );
          }
          return true;
        } else {
          throw new Error(res?.message || 'Server rejected acknowledgement');
        }
      } catch (err) {
        console.error(`Acknowledgement failed for alert ${alertId}, rolling back:`, err);
        // Rollback optimistic change
        setAlerts(previousAlerts);
        return false;
      } finally {
        setPendingAlertAcks((prev) => {
          const next = new Set(prev);
          next.delete(alertId);
          return next;
        });
      }
    },
    [alerts, pendingAlertAcks]
  );

  // Update SOS status with optimistic UI update and automatic rollback on failure
  const updateSosStatus = useCallback(
    async (sosId: string, status: string): Promise<boolean> => {
      if (pendingSosAcks.has(sosId)) return false;

      const targetSos = sosRequests.find((s) => s.id === sosId);
      if (!targetSos || targetSos.status?.toLowerCase() === status.toLowerCase()) {
        return true;
      }

      const previousSos = [...sosRequests];
      setPendingSosAcks((prev) => new Set(prev).add(sosId));

      // 1. Optimistically update shared source of truth
      setSosRequests((prev) =>
        prev.map((s) =>
          s.id === sosId
            ? { ...s, status: status as SosStatus, updatedAt: new Date().toISOString() }
            : s
        )
      );

      // 2. Persist via API
      try {
        const res = await apiUpdateSosStatus(sosId, status);
        if (res && (res.success || res.data)) {
          if (res.data) {
            setSosRequests((prev) =>
              prev.map((s) =>
                s.id === sosId ? { ...s, ...res.data, status: status as SosStatus } : s
              )
            );
          }
          return true;
        } else {
          throw new Error(res?.message || 'Server rejected SOS status update');
        }
      } catch (err) {
        console.error(`Status update failed for SOS ${sosId}, rolling back:`, err);
        // Rollback optimistic change
        setSosRequests(previousSos);
        return false;
      } finally {
        setPendingSosAcks((prev) => {
          const next = new Set(prev);
          next.delete(sosId);
          return next;
        });
      }
    },
    [sosRequests, pendingSosAcks]
  );

  // Convenience acknowledge SOS
  const acknowledgeSos = useCallback(
    async (sosId: string) => {
      return updateSosStatus(sosId, 'acknowledged');
    },
    [updateSosStatus]
  );

  const isAcknowledgingAlert = useCallback(
    (alertId: string) => pendingAlertAcks.has(alertId),
    [pendingAlertAcks]
  );

  const isUpdatingSos = useCallback(
    (sosId: string) => pendingSosAcks.has(sosId),
    [pendingSosAcks]
  );

  // DERIVED UNREAD COUNTS:
  // - An alert is "unread" if and only if it is NOT acknowledged (status === 'dispatched' or 'escalated').
  const unreadAlertsCount = useMemo(() => {
    return alerts.filter((alert) => {
      const st = (alert.status || '').toLowerCase();
      return st === 'dispatched' || st === 'escalated';
    }).length;
  }, [alerts]);

  // - An SOS is "unread" if and only if it is NOT acknowledged (status === 'pending').
  const unreadSosCount = useMemo(() => {
    return sosRequests.filter((sos) => {
      const st = (sos.status || '').toLowerCase();
      return st === 'pending';
    }).length;
  }, [sosRequests]);

  const value = useMemo(
    () => ({
      alerts,
      unreadAlertsCount,
      acknowledgeAlert,
      isAcknowledgingAlert,
      refreshAlerts,
      sosRequests,
      unreadSosCount,
      createSosRequest,
      updateSosStatus,
      acknowledgeSos,
      isUpdatingSos,
      refreshSos,
      loading,
    }),
    [
      alerts,
      unreadAlertsCount,
      acknowledgeAlert,
      isAcknowledgingAlert,
      refreshAlerts,
      sosRequests,
      unreadSosCount,
      createSosRequest,
      updateSosStatus,
      acknowledgeSos,
      isUpdatingSos,
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
