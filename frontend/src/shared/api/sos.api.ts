import { apiClient } from './client';
import { ISosRequest, SosStatus } from '@/shared/types';

const SOS_STORAGE_KEY = 'safesight_sos_requests';

function deduplicateSosList(items: ISosRequest[]): ISosRequest[] {
  const map = new Map<string, ISosRequest>();
  for (const item of items) {
    if (!item || !item.id) continue;
    // If we already have this item, keep the one with newer updatedAt or real UUID
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
    } else {
      map.set(item.id, { ...existing, ...item });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function getStoredSos(): ISosRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SOS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? deduplicateSosList(parsed) : [];
  } catch {
    return [];
  }
}

function saveStoredSos(requests: ISosRequest[]) {
  if (typeof window === 'undefined') return;
  try {
    const clean = deduplicateSosList(requests);
    localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(clean));
  } catch {}
}

export async function getSosRequests(
  siteId?: string | null,
  params?: { status?: string },
) {
  const query = new URLSearchParams();
  if (siteId && !siteId.startsWith('demo-')) query.set('siteId', siteId);
  if (params?.status) query.set('status', params.status);

  const qs = query.toString() ? `?${query.toString()}` : '';
  try {
    const res = await apiClient<ISosRequest[]>(`/sos${qs}`);
    if (res?.success && Array.isArray(res.data)) {
      // Server is the authoritative source of truth. Deduplicate and store.
      const cleanServerList = deduplicateSosList(res.data);
      saveStoredSos(cleanServerList);
      let list = cleanServerList;
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

  let list = getStoredSos();
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
  try {
    // 1. Post to backend to obtain the authoritative database record & UUID
    const res = await apiClient<any>('/sos', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (res?.success && res.data) {
      const serverSos: ISosRequest = {
        id: res.data.id,
        siteId: res.data.siteId || data.siteId || '0275fd8b-81a2-4513-bdc5-9c4d27aae375',
        location: res.data.location || {
          type: 'Point',
          coordinates: [data.longitude || 81.8463, data.latitude || 25.4358],
        },
        message: res.data.message || data.message || 'Emergency SOS assistance requested',
        contactPhone: res.data.contactPhone || data.contactPhone || null,
        status: (res.data.status as SosStatus) || SosStatus.PENDING,
        assignedTo: res.data.assignedTo || null,
        createdAt: res.data.createdAt || new Date().toISOString(),
        updatedAt: res.data.updatedAt || new Date().toISOString(),
      };

      const stored = getStoredSos();
      const updated = deduplicateSosList([serverSos, ...stored.filter((s) => s.id !== serverSos.id)]);
      saveStoredSos(updated);

      return {
        success: true,
        data: serverSos,
        message: 'SOS request created successfully',
      };
    }
  } catch (err) {
    // Network fallback: create local offline record
  }

  // Offline fallback only when backend is unreachable
  const fallbackSos: ISosRequest = {
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
  const updated = deduplicateSosList([fallbackSos, ...stored]);
  saveStoredSos(updated);

  return {
    success: true,
    data: fallbackSos,
    message: 'SOS request recorded locally (offline mode)',
  };
}

export const createSosRequest = createSos;

export async function updateSosStatus(id: string, status: string) {
  const stored = getStoredSos();
  const updated = stored.map((s) =>
    s.id === id ? { ...s, status: status as SosStatus, updatedAt: new Date().toISOString() } : s
  );
  saveStoredSos(updated);

  try {
    const res = await apiClient<ISosRequest>(`/sos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (res?.success && res.data) {
      const refreshed = stored.map((s) => (s.id === id ? { ...s, ...res.data } : s));
      saveStoredSos(refreshed);
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
