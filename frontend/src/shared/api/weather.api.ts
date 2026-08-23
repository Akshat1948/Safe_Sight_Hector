import { apiClient } from './client';
import { IWeatherData } from '@/shared/types';

export async function getWeather(siteId: string) {
  return apiClient<IWeatherData>(`/weather/${siteId}`);
}
