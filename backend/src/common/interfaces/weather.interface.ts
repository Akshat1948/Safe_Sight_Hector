export enum HazardLevel {
  NONE = 'none',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  SEVERE = 'severe',
}

export enum HazardType {
  FLOOD = 'flood',
  LANDSLIDE = 'landslide',
  LIGHTNING = 'lightning',
  HEAT = 'heat',
  OTHER = 'other',
}

export interface IWeatherCurrent {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  condition: string;
  precipitation: number;
  visibility: number;
}

export interface IHazardAssessment {
  level: HazardLevel;
  type: HazardType | null;
  advisory: string | null;
}

export interface IWeatherForecastPoint {
  time: string;
  temperature: number;
  condition: string;
  precipitation: number;
}

export interface IWeatherData {
  id?: string;
  siteId: string;
  current: IWeatherCurrent;
  hazard: IHazardAssessment;
  forecast: IWeatherForecastPoint[];
  fetchedAt: string | Date;
}
