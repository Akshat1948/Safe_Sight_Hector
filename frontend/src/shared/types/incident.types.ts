import { GeoJSONPoint } from './zone.types';

export interface IIncident {
  id: string;
  siteId: string;
  zoneId: string | null;
  zoneName: string | null;
  incidentType: IncidentType;
  severity: Severity;
  status: IncidentStatus;
  title: string;
  description: string | null;
  location: GeoJSONPoint | null;
  confidenceScore: number | null;
  detectionSource: DetectionSource;
  verifiedBy: string | null;
  verifiedAt: string | null;
  resolvedAt: string | null;
  imageUrls?: string[] | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export enum IncidentType {
  CRUSH_PRECURSOR = 'crush_precursor',
  MEDICAL_EMERGENCY = 'medical_emergency',
  GEOFENCE_BREACH = 'geofence_breach',
  ENVIRONMENTAL_HAZARD = 'environmental_hazard',
  STAMPEDE = 'stampede',
  FIRE = 'fire',
  OTHER = 'other',
}

export enum IncidentStatus {
  FLAGGED = 'flagged',
  VERIFIED = 'verified',
  DISMISSED = 'dismissed',
  RESPONDING = 'responding',
  RESOLVED = 'resolved',
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum DetectionSource {
  AI = 'ai',
  MANUAL = 'manual',
  SOS = 'sos',
}

export interface IncidentListResponse {
  incidents: IIncident[];
  total: number;
  limit: number;
  offset: number;
}
