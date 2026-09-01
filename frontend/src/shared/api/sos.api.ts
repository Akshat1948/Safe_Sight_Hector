import { apiClient } from './client';
import { ISosRequest } from '@/shared/types';

export async function getSosRequests(
  siteId?: string | null,
  params?: { status?: string },
) {
  const query = new URLSearchParams();
  if (siteId && !siteId.startsWith('demo-')) query.set('siteId', siteId);
  if (params?.status) query.set('status', params.status);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiClient<ISosRequest[]>(`/sos${qs}`);
}

export async function createSos(data: {
  siteId?: string | null;
  latitude?: number;
  longitude?: number;
  message?: string | null;
  contactPhone?: string | null;
}) {
  return apiClient<any>('/sos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export const createSosRequest = createSos;

export async function updateSosStatus(id: string, status: string) {
  return apiClient<ISosRequest>(`/sos/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
