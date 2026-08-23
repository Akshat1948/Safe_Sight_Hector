export enum SosStatus {
  PENDING = 'pending',
  ACKNOWLEDGED = 'acknowledged',
  RESPONDING = 'responding',
  RESOLVED = 'resolved',
}

export interface ISosRequest {
  id: string;
  siteId: string | null;
  location: GeoJSON.Point | null;
  message: string | null;
  contactPhone: string | null;
  status: SosStatus;
  assignedTo: string | null;
  sessionToken?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}
