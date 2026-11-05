import { WeatherProviderError } from './weatherService';
import type { RegionalTemperaturePoint } from '../types/weather';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const GRID_SPACING_DEGREES = 0.04;
const GRID_OFFSETS = [-1, 0, 1] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Returns current temperatures for a small grid around the farm location for map shading. */
export async function getRegionalTemperatureGrid(
  latitude: number,
  longitude: number,
): Promise<RegionalTemperaturePoint[]> {
  const locations = GRID_OFFSETS.flatMap((latitudeOffset) =>
    GRID_OFFSETS.map((longitudeOffset) => ({
      latitude: latitude + latitudeOffset * GRID_SPACING_DEGREES,
      longitude: longitude + longitudeOffset * GRID_SPACING_DEGREES,
    })),
  );
  const url = new URL(OPEN_METEO_URL);
  url.search = new URLSearchParams({
    latitude: locations.map((location) => String(location.latitude)).join(','),
    longitude: locations.map((location) => String(location.longitude)).join(','),
    current: 'temperature_2m',
    timezone: 'auto',
  }).toString();

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch (error) {
    console.error('Open-Meteo regional temperature request failed:', error);
    throw new WeatherProviderError('Nearby temperatures could not be loaded. Please try again later.');
  }
  if (!response.ok) {
    console.error('Open-Meteo regional temperature request returned an error:', response.status);
    throw new WeatherProviderError('Nearby temperatures are temporarily unavailable. Please try again later.');
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (error) {
    console.error('Open-Meteo returned invalid regional temperature JSON:', error);
    throw new WeatherProviderError('The weather service returned invalid nearby temperatures.');
  }

  if (!Array.isArray(data) || data.length !== locations.length) {
    throw new WeatherProviderError('The weather service returned incomplete nearby temperatures.');
  }

  return data.map((item): RegionalTemperaturePoint => {
    if (
      !isRecord(item) ||
      !isRecord(item.current) ||
      !isFiniteNumber(item.latitude) ||
      !isFiniteNumber(item.longitude) ||
      !isFiniteNumber(item.current.temperature_2m)
    ) {
      throw new WeatherProviderError('The weather service returned invalid nearby temperatures.');
    }
    return {
      latitude: item.latitude,
      longitude: item.longitude,
      temperatureC: item.current.temperature_2m,
    };
  });
}
