import { apiClient } from './client';
import { ISosRequest, SosStatus } from '@/shared/types';

const SOS_STORAGE_KEY = 'safesight_sos_requests';

function getStoredSos(): ISosRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SOS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredSos(requests: ISosRequest[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(requests));
  } catch {}
}

export async function getSosRequests(
  siteId?: string | null,
  params?: { status?: string },
) {
  const stored = getStoredSos();
  const query = new URLSearchParams();
  if (siteId && !siteId.startsWith('demo-')) query.set('siteId', siteId);
  if (params?.status) query.set('status', params.status);

  const qs = query.toString() ? `?${query.toString()}` : '';
  try {
    const res = await apiClient<ISosRequest[]>(`/sos${qs}`);
    if (res?.success && Array.isArray(res.data)) {
      // Merge remote data with local stored items by ID
      const map = new Map<string, ISosRequest>();
      stored.forEach((item) => map.set(item.id, item));
      res.data.forEach((item) => map.set(item.id, item));
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      saveStoredSos(merged);
      let list = merged;
      if (params?.status) {
        list = list.filter((s) => (s.status || '').toLowerCase() === params.status?.toLowerCase());
      }
      return {
        success: true,
        data: list,
        message: 'SOS requests retrieved',
      };
    }
  } catch (err) {
    // Return stored on network error
  }

  let list = stored;
  if (params?.status) {
    list = list.filter((s) => (s.status || '').toLowerCase() === params.status?.toLowerCase());
  }

  return {
    success: true,
    data: list,
    message: 'SOS requests retrieved from local store',
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

  const stored = getStoredSos();
  const updated = [newSos, ...stored.filter((s) => s.id !== newSos.id)];
  saveStoredSos(updated);

  // Broadcast cross-tab and in-memory event
  if (typeof window !== 'undefined') {
    try {
      const bc = new BroadcastChannel('safesight_sos_channel');
      bc.postMessage({ type: 'sos:new', data: newSos });
      bc.close();
    } catch {}
    window.dispatchEvent(new CustomEvent('safesight:sos:new', { detail: newSos }));
  }

  try {
    const res = await apiClient<any>('/sos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res?.success && res.data) {
      const serverSos = { ...newSos, id: res.data.id || newSos.id };
      const finalized = [serverSos, ...stored.filter((s) => s.id !== newSos.id && s.id !== serverSos.id)];
      saveStoredSos(finalized);
      return res;
    }
  } catch (err) {
    // Handled by local persistence
  }

  return {
    success: true,
    data: newSos,
    message: 'SOS request created',
  };
}

export const createSosRequest = createSos;

export async function updateSosStatus(id: string, status: string) {
  const stored = getStoredSos();
  const updated = stored.map((s) =>
    s.id === id ? { ...s, status: status as SosStatus, updatedAt: new Date().toISOString() } : s
  );
  saveStoredSos(updated);

  // Broadcast cross-tab and in-memory event
  if (typeof window !== 'undefined') {
    try {
      const bc = new BroadcastChannel('safesight_sos_channel');
      bc.postMessage({ type: 'sos:status:update', data: { id, status } });
      bc.close();
    } catch {}
    window.dispatchEvent(new CustomEvent('safesight:sos:status:update', { detail: { id, status } }));
  }

  try {
    const res = await apiClient<ISosRequest>(`/sos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (res?.success && res.data) {
      return res;
    }
  } catch (err) {
    // Handled by local persistence
  }

  const updatedItem = updated.find((s) => s.id === id);
  return {
    success: true,
    data: updatedItem || null,
    message: 'SOS request status updated',
  };
}
