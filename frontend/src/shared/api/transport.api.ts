import { apiClient } from './client';
import { IParkingStatus, IShuttleStatus } from '@/shared/types';

export async function getParkingStatus(siteId?: string) {
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : '';
  return apiClient<IParkingStatus[]>(`/transport/parking${query}`);
}

export async function getShuttleStatus(siteId?: string) {
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : '';
  return apiClient<IShuttleStatus[]>(`/transport/shuttles${query}`);
}

export async function updateTransportStatus(
  id: string,
  data: {
    currentOccupancy?: number;
    status?: string;
    nextDeparture?: string | null;
  },
) {
  return apiClient<any>(`/transport/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
