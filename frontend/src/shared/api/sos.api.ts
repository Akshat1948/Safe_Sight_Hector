import { apiClient } from './client';
import { ISosRequest, SosStatus } from '@/shared/types';

let localDemoSos: ISosRequest[] = [
  {
    id: 'SOS-2026-001',
    siteId: '0275fd8b-81a2-4513-bdc5-9c4d27aae375',
    location: { type: 'Point', coordinates: [81.8463, 25.4358] },
    message: 'Elderly person collapsed near Sangam River Ghat Steps. High surge pressure detected.',
    contactPhone: '+919876500001',
    status: SosStatus.PENDING,
    assignedTo: null,
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: 'SOS-2026-002',
    siteId: '0275fd8b-81a2-4513-bdc5-9c4d27aae375',
    location: { type: 'Point', coordinates: [81.8425, 25.4335] },
    message: 'Child separated from family near Main Entry Gate 4. Requesting security assistance.',
    contactPhone: '+919876500002',
    status: SosStatus.ACKNOWLEDGED,
    assignedTo: 'responder-team-bravo',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
];

export async function getSosRequests(
  siteId?: string | null,
  params?: { status?: string },
) {
  const query = new URLSearchParams();
  if (siteId && !siteId.startsWith('demo-')) query.set('siteId', siteId);
  if (params?.status) query.set('status', params.status);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await apiClient<ISosRequest[]>(`/sos${qs}`);
  if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
    return res;
  }

  let list = [...localDemoSos];
  if (params?.status) {
    list = list.filter((s) => s.status.toLowerCase() === params.status?.toLowerCase());
  }

  return {
    success: true,
    data: list,
    message: 'SOS requests retrieved',
  };
}

export async function createSos(data: {
  siteId?: string | null;
  latitude?: number;
  longitude?: number;
  message?: string | null;
  contactPhone?: string | null;
}) {
  const newSos: ISosRequest = {
    id: `SOS-${Date.now().toString().slice(-6)}`,
    siteId: data.siteId || '0275fd8b-81a2-4513-bdc5-9c4d27aae375',
    location: { type: 'Point', coordinates: [data.longitude || 81.8463, data.latitude || 25.4358] },
    message: data.message || 'Emergency SOS assistance requested',
    contactPhone: data.contactPhone || null,
    status: SosStatus.PENDING,
    assignedTo: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localDemoSos = [newSos, ...localDemoSos.filter((s) => s.id !== newSos.id)];

  try {
    const res = await apiClient<any>('/sos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res?.success && res.data) {
      return res;
    }
  } catch (err) {
    // Handled by localDemoSos return
  }

  return {
    success: true,
    data: newSos,
    message: 'SOS request created',
  };
}

export const createSosRequest = createSos;

export async function updateSosStatus(id: string, status: string) {
  localDemoSos = localDemoSos.map((s) =>
    s.id === id ? { ...s, status: status as SosStatus, updatedAt: new Date().toISOString() } : s
  );

  try {
    const res = await apiClient<ISosRequest>(`/sos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (res?.success && res.data) {
      return res;
    }
  } catch (err) {
    // Handled by local state
  }

  const updated = localDemoSos.find((s) => s.id === id);
  return {
    success: true,
    data: updated || null,
    message: 'SOS request status updated',
  };
}
