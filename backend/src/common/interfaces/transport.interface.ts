export enum TransportType {
  PARKING = 'parking',
  SHUTTLE = 'shuttle',
  BUS = 'bus',
}

export enum TransportStatus {
  OPERATIONAL = 'operational',
  FULL = 'full',
  CLOSED = 'closed',
  DELAYED = 'delayed',
}

export interface IParkingStatus {
  id: string;
  name: string;
  totalCapacity: number;
  currentOccupancy: number;
  status: TransportStatus;
  location?: GeoJSON.Point | null;
  updatedAt?: string | Date;
}

export interface IShuttleStatus {
  id: string;
  name: string;
  status: TransportStatus;
  currentOccupancy: number;
  totalCapacity: number;
  nextDeparture: string | Date | null;
  routeInfo: string | null;
  location?: GeoJSON.Point | null;
  updatedAt?: string | Date;
}
