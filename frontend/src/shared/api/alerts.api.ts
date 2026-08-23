import { apiClient } from './client';
import { CreateAlertRequest, IAlert, AlertSeverity, AlertStatus, AlertChannel } from '@/shared/types';

let localDemoAlerts: IAlert[] = [
  {
    id: 'alert-demo-1',
    incidentId: 'inc-demo-1',
    siteId: 'demo-site-prayagraj-01',
    targetZoneId: 'zone-c-staircase',
    targetZoneName: 'Zone C — Main Staircase Chokepoint',
    severity: AlertSeverity.CRITICAL,
    title: 'Hold Position: Avoid Zone C Staircase',
    message: 'High density detected at main staircase. Hold position and use Zone D assembly ground corridor.',
    messageHi: 'ज़ोन C सीढ़ियों पर भारी भीड़ है। कृपया वहीं रुकें और ज़ोन D कॉरिडोर का प्रयोग करें।',
    channels: [AlertChannel.PUSH, AlertChannel.DASHBOARD, AlertChannel.PA_SYSTEM],
    status: AlertStatus.DISPATCHED,
    createdBy: 'demo-manager-uuid-01',
    acknowledgedBy: null,
    acknowledgedAt: null,
    createdAt: new Date().toISOString(),
  },
];

export async function getAlerts(
  siteId: string,
  params?: { status?: string; severity?: string },
) {
  const query = new URLSearchParams({ siteId });
  if (params?.status) query.set('status', params.status);
  if (params?.severity) query.set('severity', params.severity);

  const res = await apiClient<IAlert[]>(`/alerts?${query}`);
  if (res.success && res.data && res.data.length > 0) {
    return res;
  }

  let list = [...localDemoAlerts];
  if (params?.status) {
    list = list.filter((a) => a.status.toLowerCase() === params.status?.toLowerCase());
  }
  if (params?.severity) {
    list = list.filter((a) => a.severity.toLowerCase() === params.severity?.toLowerCase());
  }

  return {
    success: true,
    data: list,
    message: 'Demo alerts loaded',
  };
}

export async function createAlert(data: CreateAlertRequest) {
  const res = await apiClient<IAlert>('/alerts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res.success && res.data) {
    return res;
  }

  const newAlert: IAlert = {
    id: `alert-demo-${Date.now()}`,
    incidentId: data.incidentId || null,
    siteId: data.siteId,
    targetZoneId: data.targetZoneId || null,
    targetZoneName: data.targetZoneId ? 'Target Zone' : 'Site Wide',
    severity: data.severity,
    title: data.title,
    message: data.message,
    messageHi: null,
    channels: data.channels,
    status: AlertStatus.DISPATCHED,
    createdBy: 'demo-manager-uuid-01',
    acknowledgedBy: null,
    acknowledgedAt: null,
    createdAt: new Date().toISOString(),
  };

  localDemoAlerts = [newAlert, ...localDemoAlerts];
  return {
    success: true,
    data: newAlert,
    message: 'Demo alert created and dispatched',
  };
}

export async function acknowledgeAlert(id: string) {
  const res = await apiClient<IAlert>(`/alerts/${id}/acknowledge`, {
    method: 'PATCH',
  });
  if (res.success && res.data) {
    return res;
  }

  localDemoAlerts = localDemoAlerts.map((a) =>
    a.id === id
      ? {
          ...a,
          status: AlertStatus.ACKNOWLEDGED,
          acknowledgedAt: new Date().toISOString(),
          acknowledgedBy: 'demo-responder-uuid-01',
        }
      : a
  );
  const updated = localDemoAlerts.find((a) => a.id === id)!;
  return {
    success: true,
    data: updated,
    message: 'Demo alert acknowledged',
  };
}
