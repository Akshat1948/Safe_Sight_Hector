import { GeoJSONPoint } from './zone.types';

export interface ISosRequest {
  id: string;
  siteId: string | null;
  location: GeoJSONPoint | null;
  message: string | null;
  contactPhone: string | null;
  status: SosStatus;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum SosStatus {
  PENDING = 'pending',
  ACKNOWLEDGED = 'acknowledged',
  RESPONDING = 'responding',
  RESOLVED = 'resolved',
}
