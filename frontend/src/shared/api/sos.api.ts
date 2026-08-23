import { apiClient } from './client';
import { ISosRequest } from '@/shared/types';

export async function getSosRequests(
  siteId: string,
  params?: { status?: string },
) {
  const query = new URLSearchParams({ siteId });
  if (params?.status) query.set('status', params.status);

  return apiClient<ISosRequest[]>(`/sos?${query}`);
}

export async function createSosRequest(data: {
  siteId?: string;
  latitude?: number;
  longitude?: number;
  message?: string;
  contactPhone?: string;
}) {
  return apiClient<ISosRequest>('/sos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSosStatus(id: string, status: string) {
  return apiClient<ISosRequest>(`/sos/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

