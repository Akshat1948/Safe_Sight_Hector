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
  totalCapacity: number | null;
  currentOccupancy: number;
  status: TransportStatus;
  location?: { latitude: number; longitude: number } | any | null;
}

export interface IShuttleStatus {
  id: string;
  name: string;
  status: TransportStatus;
  currentOccupancy: number;
  totalCapacity: number | null;
  nextDeparture: string | null;
  routeInfo: string | null;
}
