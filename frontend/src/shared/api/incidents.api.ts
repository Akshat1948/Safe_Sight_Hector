import { apiClient } from './client';
import { IIncident, IncidentListResponse, IncidentType, IncidentStatus, Severity, DetectionSource } from '@/shared/types';

let localDemoIncidents: IIncident[] = [
  {
    id: 'inc-demo-1',
    siteId: 'demo-site-prayagraj-01',
    zoneId: 'zone-c-staircase',
    zoneName: 'Zone C — Main Staircase Chokepoint',
    incidentType: IncidentType.CRUSH_PRECURSOR,
    severity: Severity.CRITICAL,
    status: IncidentStatus.FLAGGED,
    title: 'Crush Precursor: Rapid Density Spike with Slowing Flow Velocity',
    description: 'Sensors detect crowd density at 92% with flow velocity dropping below 0.3 m/s on narrow steps.',
    location: { type: 'Point', coordinates: [81.8463, 25.4358] },
    confidenceScore: 0.94,
    detectionSource: DetectionSource.AI,
    verifiedBy: null,
    verifiedAt: null,
    resolvedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inc-demo-2',
    siteId: 'demo-site-prayagraj-01',
    zoneId: 'zone-a-entry',
    zoneName: 'Zone A — Main Entry Plaza',
    incidentType: IncidentType.MEDICAL_EMERGENCY,
    severity: Severity.MEDIUM,
    status: IncidentStatus.VERIFIED,
    title: 'Dehydration & Medical Assistance Required near Gate 2',
    description: 'Elderly visitor requires emergency rehydration and primary medical attention.',
    location: { type: 'Point', coordinates: [81.8425, 25.4335] },
    confidenceScore: 0.89,
    detectionSource: DetectionSource.MANUAL,
    imageUrls: [
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=800&auto=format&fit=crop&q=80'
    ],
    verifiedBy: 'demo-manager-uuid-01',
    verifiedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    resolvedAt: null,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'inc-demo-4',
    siteId: 'demo-site-prayagraj-01',
    zoneId: 'zone-d-assembly',
    zoneName: 'Zone D — Safe Assembly Ground',
    incidentType: IncidentType.OTHER,
    severity: Severity.HIGH,
    status: IncidentStatus.FLAGGED,
    title: 'Damaged Crowd Barricade & Narrow Passage',
    description: 'Visitors submitted photos of a fallen security barricade causing bottleneck in Sector 4.',
    location: { type: 'Point', coordinates: [81.8450, 25.4320] },
    confidenceScore: null,
    detectionSource: DetectionSource.MANUAL,
    imageUrls: [
      'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80'
    ],
    verifiedBy: null,
    verifiedAt: null,
    resolvedAt: null,
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: 'inc-demo-3',
    siteId: 'demo-site-prayagraj-01',
    zoneId: 'zone-b-corridor',
    zoneName: 'Zone B — Riverside Corridor',
    incidentType: IncidentType.GEOFENCE_BREACH,
    severity: Severity.HIGH,
    status: IncidentStatus.RESPONDING,
    title: 'Perimeter Barricade Pressure at River Ghat',
    description: 'High crowd pressure recorded against primary queue barricade.',
    location: { type: 'Point', coordinates: [81.8475, 25.4345] },
    confidenceScore: 0.91,
    detectionSource: DetectionSource.AI,
    verifiedBy: 'demo-manager-uuid-01',
    verifiedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    resolvedAt: null,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

export async function getIncidents(
  siteId: string,
  params?: { status?: string; severity?: string; limit?: number; offset?: number },
) {
  const query = new URLSearchParams({ siteId });
  if (params?.status) query.set('status', params.status);
  if (params?.severity) query.set('severity', params.severity);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));

  const res = await apiClient<IncidentListResponse>(`/incidents?${query}`);
  if (res.success && res.data && res.data.incidents?.length > 0) {
    return res;
  }

  let list = [...localDemoIncidents];
  if (params?.status) {
    list = list.filter((i) => i.status.toLowerCase() === params.status?.toLowerCase());
  }
  if (params?.severity) {
    list = list.filter((i) => i.severity.toLowerCase() === params.severity?.toLowerCase());
  }

  return {
    success: true,
    data: {
      incidents: list,
      total: list.length,
      limit: params?.limit || 50,
      offset: params?.offset || 0,
    },
    message: 'Demo incidents loaded',
  };
}

export async function getIncident(id: string) {
  const res = await apiClient<IIncident>(`/incidents/${id}`);
  if (res.success && res.data) {
    return res;
  }
  const found = localDemoIncidents.find((i) => i.id === id) || localDemoIncidents[0];
  return {
    success: true,
    data: found,
    message: 'Demo incident loaded',
  };
}

export async function verifyIncident(id: string, action: 'verify' | 'dismiss') {
  const res = await apiClient<IIncident>(`/incidents/${id}/verify`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
  if (res.success && res.data) {
    return res;
  }

  localDemoIncidents = localDemoIncidents.map((i) =>
    i.id === id
      ? {
          ...i,
          status: action === 'verify' ? IncidentStatus.VERIFIED : IncidentStatus.DISMISSED,
          verifiedAt: new Date().toISOString(),
        }
      : i
  );
  const updated = localDemoIncidents.find((i) => i.id === id)!;
  return {
    success: true,
    data: updated,
    message: `Demo incident ${action}ed`,
  };
}

export async function updateIncidentStatus(id: string, status: 'responding' | 'resolved') {
  const res = await apiClient<IIncident>(`/incidents/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (res.success && res.data) {
    return res;
  }

  localDemoIncidents = localDemoIncidents.map((i) =>
    i.id === id
      ? {
          ...i,
          status: status === 'responding' ? IncidentStatus.RESPONDING : IncidentStatus.RESOLVED,
          resolvedAt: status === 'resolved' ? new Date().toISOString() : null,
        }
      : i
  );
  const updated = localDemoIncidents.find((i) => i.id === id)!;
  return {
    success: true,
    data: updated,
    message: `Demo incident status updated to ${status}`,
  };
}
