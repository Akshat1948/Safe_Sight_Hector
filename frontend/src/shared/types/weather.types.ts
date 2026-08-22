export interface IWeatherCurrent {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  condition: string;
  precipitation: number;
  visibility: number;
}

export interface IHazard {
  level: string;
  type: string | null;
  advisory: string | null;
}

export interface IForecastPoint {
  time: string;
  temperature: number;
  condition: string;
  precipitation: number;
}

export interface IWeatherData {
  siteId: string;
  current: IWeatherCurrent;
  hazard: IHazard;
  forecast: IForecastPoint[];
  fetchedAt: string;
}
