export enum ZoneType {
  ENTRY_EXIT = 'entry_exit',
  HIGH_RISK = 'high_risk',
  RESTRICTED = 'restricted',
  MEDICAL_AID = 'medical_aid',
  SAFE_ASSEMBLY = 'safe_assembly',
  CORRIDOR = 'corridor',
  PARKING = 'parking',
  GENERAL = 'general',
}

export enum DensityStatus {
  GREEN = 'green',
  YELLOW = 'yellow',
  ORANGE = 'orange',
  RED = 'red',
}

export enum GeofenceType {
  BOUNDARY = 'boundary',
  RESTRICTED = 'restricted',
  ALERT_RADIUS = 'alert_radius',
}

export interface IZone {
  id: string;
  siteId: string;
  name: string;
  zoneType: ZoneType;
  polygon: GeoJSON.Polygon;
  maxCapacity: number;
  currentDensity: number;
  densityStatus: DensityStatus;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IGeofence {
  id: string;
  zoneId: string;
  name: string;
  fenceType: GeofenceType;
  polygon: GeoJSON.Polygon;
  alertOnEntry: boolean;
  alertOnExit: boolean;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
