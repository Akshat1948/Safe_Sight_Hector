export interface IZone {
  id: string;
  siteId: string;
  name: string;
  zoneType: ZoneType;
  polygon: GeoJSONPolygon;
  maxCapacity: number;
  currentDensity: number;
  densityStatus: DensityStatus;
  isActive: boolean;
  updatedAt: string;
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number];
}

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

export interface IDensityReading {
  headcount: number;
  flowRate: number;
  flowVelocity: number;
  recordedAt: string;
}

export interface IZoneDensity {
  zoneId: string;
  zoneName: string;
  currentDensity: number;
  maxCapacity: number;
  densityStatus: DensityStatus;
  readings: IDensityReading[];
}
