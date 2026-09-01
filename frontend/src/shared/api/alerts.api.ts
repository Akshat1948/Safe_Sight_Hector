import { apiClient } from './client';
import { CreateAlertRequest, IAlert, AlertSeverity, AlertStatus, AlertChannel } from '@/shared/types';

const DEFAULT_DEMO_ALERTS: IAlert[] = [
  {
    id: 'ALT-2026-001',
    siteId: '0275fd8b-81a2-4513-bdc5-9c4d27aae375',
    incidentId: 'INC-294-81A',
    targetZoneId: 'zone-sangam-ghat',
    targetZoneName: 'Sangam Main Ghat',
    severity: AlertSeverity.CRITICAL,
    title: 'High Surge Warning — Sangam Ghat Gate 3',
    message: 'High crowd density threshold (92%) breached near Gate 3 steps. Diverting pilgrim inflow to Corridor 4.',
    messageHi: 'संगम मुख्य घाट गेट 3 पर भीड़ का अत्यधिक दबाव। कृपया कॉरिडोर 4 की ओर प्रस्थान करें।',
    channels: [AlertChannel.DASHBOARD, AlertChannel.PUSH, AlertChannel.PA_SYSTEM],
    status: AlertStatus.ACKNOWLEDGED,
    createdBy: 'commander-01',
    acknowledgedBy: 'commander-01',
    acknowledgedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'ALT-2026-002',
    siteId: '0275fd8b-81a2-4513-bdc5-9c4d27aae375',
    incidentId: null,
    targetZoneId: 'zone-parking-a',
    targetZoneName: 'Parking Lot A — North',
    severity: AlertSeverity.WARNING,
    title: 'Parking Lot A Capacity Reached',
    message: 'Parking Lot A has exceeded 95% capacity. Electronic signage redirecting upcoming vehicles to Lot B & C.',
    messageHi: 'पार्किंग स्थल A पूर्णतः भर चुका है। कृपया पार्किंग स्थल B और C का उपयोग करें।',
    channels: [AlertChannel.DASHBOARD, AlertChannel.SMS],
    status: AlertStatus.ACKNOWLEDGED,
    createdBy: 'traffic-ai-system',
    acknowledgedBy: 'traffic-ai-system',
    acknowledgedAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  },
  {
    id: 'ALT-2026-003',
    siteId: '0275fd8b-81a2-4513-bdc5-9c4d27aae375',
    incidentId: null,
    targetZoneId: null,
    targetZoneName: 'Site-Wide',
    severity: AlertSeverity.ADVISORY,
    title: 'Afternoon Heat & Hydration Advisory',
    message: 'Temperature peaking at 34°C with high humidity. Free ORS and chilled water distribution points active at all major corridors.',
    messageHi: 'गर्मी और उमस का स्तर बढ़ रहा है। सभी मुख्य मार्गों पर निःशुल्क ओआरएस और शीतल जल उपलब्ध है।',
    channels: [AlertChannel.DASHBOARD, AlertChannel.PUSH, AlertChannel.PA_SYSTEM],
    status: AlertStatus.ACKNOWLEDGED,
    createdBy: 'health-coordinator',
    acknowledgedBy: 'medical-lead-dr-sharma',
    acknowledgedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },
  {
    id: 'ALT-2026-004',
    siteId: '0275fd8b-81a2-4513-bdc5-9c4d27aae375',
    incidentId: null,
    targetZoneId: 'zone-corridor-b',
    targetZoneName: 'Corridor B (Expressway Link)',
    severity: AlertSeverity.INFORMATIONAL,
    title: 'Electric Shuttle Frequency Increased',
    message: 'Shuttle Express Route 1 headway reduced from 15 mins to 6 mins to support smooth evening pilgrim transit.',
    messageHi: 'शाम की भीड़ को देखते हुए इलेक्ट्रिक शटल सेवा की आवृत्ति बढ़ाकर हर 6 मिनट कर दी गई है।',
    channels: [AlertChannel.DASHBOARD, AlertChannel.PUSH],
    status: AlertStatus.ACKNOWLEDGED,
    createdBy: 'transit-ops',
    acknowledgedBy: 'transit-supervisor',
    acknowledgedAt: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
];

let localDemoAlerts: IAlert[] = [...DEFAULT_DEMO_ALERTS];

export async function getAlerts(
  siteId?: string | null,
  params?: { status?: string; severity?: string },
) {
  const query = new URLSearchParams();
  if (siteId && !siteId.startsWith('demo-')) query.set('siteId', siteId);
  if (params?.status) query.set('status', params.status);
  if (params?.severity) query.set('severity', params.severity);

  const qs = query.toString() ? `?${query.toString()}` : '';
  try {
    const res = await apiClient<IAlert[]>(`/alerts${qs}`);
    if (res?.success && Array.isArray(res.data)) {
      let list = res.data;
      if (params?.status) {
        list = list.filter((a) => (a.status || '').toLowerCase() === params.status?.toLowerCase());
      }
      if (params?.severity) {
        list = list.filter((a) => (a.severity || '').toLowerCase() === params.severity?.toLowerCase());
      }
      return {
        success: true,
        data: list,
        message: 'Alerts loaded',
      };
    }
  } catch (err) {
    // Offline fallback
  }

  let list = [...localDemoAlerts];
  if (params?.status) {
    list = list.filter((a) => (a.status || '').toLowerCase() === params.status?.toLowerCase());
  }
  if (params?.severity) {
    list = list.filter((a) => (a.severity || '').toLowerCase() === params.severity?.toLowerCase());
  }

  return {
    success: true,
    data: list,
    message: 'Alerts loaded',
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
