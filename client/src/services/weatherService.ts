import type { ApiResponse } from '../types/api';
import type { FarmLocation } from '../types/farm';
import type { FarmWeatherForecast, RegionalTemperaturePoint } from '../types/weather';
import { requestWorker } from './workerApi';

export async function getFarmWeatherForecast(): Promise<FarmWeatherForecast> {
  const response: ApiResponse<FarmWeatherForecast> = await requestWorker<FarmWeatherForecast>(
    '/api/weather/forecast',
  );
  if (!response.data) {
    throw new Error('The weather service returned no forecast data.');
  }
  return response.data;
}

export async function getRegionalTemperatureGrid(
  location: FarmLocation,
): Promise<RegionalTemperaturePoint[]> {
  const query = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
  });
  const response: ApiResponse<RegionalTemperaturePoint[]> = await requestWorker<RegionalTemperaturePoint[]>(
    `/api/weather/temperature-grid?${query.toString()}`,
  );
  if (!response.data) {
    throw new Error('The weather service returned no nearby temperatures.');
  }
  return response.data;
}
