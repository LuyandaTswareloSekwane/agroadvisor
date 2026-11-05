import { FirestoreRestError, getDocument, type FirestoreDocument, type FirestoreValue } from '../lib/firestoreRest';
import type { Env } from '../types/env';
import type {
  CurrentWeather,
  DailyWeather,
  FarmWeatherForecast,
  FarmWeatherLocation,
  HourlyWeather,
} from '../types/weather';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const FORECAST_DAYS = 7;
const WEATHER_CODE_DESCRIPTIONS: Readonly<Record<number, string>> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

interface FarmWeatherInput {
  locationName: string;
  latitude: number;
  longitude: number;
}

interface OpenMeteoResponse {
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    rain: number;
    showers: number;
    snowfall: number;
    weather_code: number;
    cloud_cover: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: Array<number | null>;
    weather_code: Array<number | null>;
    precipitation_probability: Array<number | null>;
    is_day: Array<number | null>;
  };
  daily: {
    time: string[];
    weather_code: Array<number | null>;
    temperature_2m_max: Array<number | null>;
    temperature_2m_min: Array<number | null>;
    precipitation_sum: Array<number | null>;
    rain_sum: Array<number | null>;
    precipitation_probability_max: Array<number | null>;
    wind_speed_10m_max: Array<number | null>;
    wind_gusts_10m_max: Array<number | null>;
    sunrise: Array<string | null>;
    sunset: Array<string | null>;
  };
}

export class FarmNotFoundError extends Error {
  constructor() {
    super('Set up your farm profile before requesting its forecast.');
    this.name = 'FarmNotFoundError';
  }
}

export class InvalidFarmLocationError extends Error {
  constructor() {
    super('The saved farm profile does not contain a valid location.');
    this.name = 'InvalidFarmLocationError';
  }
}

export class WeatherProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherProviderError';
  }
}

function field(fields: Record<string, FirestoreValue>, key: string): FirestoreValue | undefined {
  return fields[key];
}

function stringField(fields: Record<string, FirestoreValue>, key: string): string | null {
  const value = field(fields, key);
  return value && 'stringValue' in value ? value.stringValue : null;
}

function numberField(fields: Record<string, FirestoreValue>, key: string): number | null {
  const value = field(fields, key);
  if (value && 'doubleValue' in value && Number.isFinite(value.doubleValue)) {
    return value.doubleValue;
  }
  if (value && 'integerValue' in value) {
    const parsed = Number(value.integerValue);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mapField(fields: Record<string, FirestoreValue>, key: string): Record<string, FirestoreValue> | null {
  const value = field(fields, key);
  return value && 'mapValue' in value ? value.mapValue.fields ?? {} : null;
}

function readFarmLocation(document: FirestoreDocument): FarmWeatherInput {
  if (!isRecord(document) || !isRecord(document.fields)) {
    throw new InvalidFarmLocationError();
  }
  const fields = document.fields;
  const location = mapField(fields, 'location');
  const locationName = stringField(fields, 'locationName');
  const latitude = location ? numberField(location, 'latitude') : null;
  const longitude = location ? numberField(location, 'longitude') : null;

  if (
    !locationName ||
    latitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude === null ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new InvalidFarmLocationError();
  }

  return { locationName, latitude, longitude };
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullableNumberArray(value: unknown): value is Array<number | null> {
  return Array.isArray(value) && value.every((item) => item === null || isNumber(item));
}

function isNullableStringArray(value: unknown): value is Array<string | null> {
  return Array.isArray(value) && value.every((item) => item === null || typeof item === 'string');
}

function describeWeatherCode(code: number | null): string | null {
  if (code === null) {
    return null;
  }
  return WEATHER_CODE_DESCRIPTIONS[code] ?? 'Other weather conditions';
}

function isOpenMeteoResponse(value: unknown): value is OpenMeteoResponse {
  if (!isRecord(value) || typeof value.timezone !== 'string') {
    return false;
  }

  if (!isRecord(value.current)) {
    return false;
  }
  const current = value.current;
  if (typeof current.time !== 'string' || !isNumber(current.is_day)) {
    return false;
  }
  const currentKeys = [
    'temperature_2m',
    'apparent_temperature',
    'relative_humidity_2m',
    'precipitation',
    'rain',
    'showers',
    'snowfall',
    'weather_code',
    'cloud_cover',
    'wind_speed_10m',
    'wind_direction_10m',
  ] as const;
  if (!currentKeys.every((key) => isNumber(current[key]))) {
    return false;
  }

  if (!isRecord(value.daily)) {
    return false;
  }
  if (!isRecord(value.hourly)) {
    return false;
  }
  const hourly = value.hourly;
  const daily = value.daily;
  return (
    Array.isArray(hourly.time) &&
    hourly.time.every((time) => typeof time === 'string') &&
    isNullableNumberArray(hourly.temperature_2m) &&
    isNullableNumberArray(hourly.weather_code) &&
    isNullableNumberArray(hourly.precipitation_probability) &&
    isNullableNumberArray(hourly.is_day) &&
    Array.isArray(daily.time) &&
    daily.time.every((date) => typeof date === 'string') &&
    isNullableNumberArray(daily.weather_code) &&
    isNullableNumberArray(daily.temperature_2m_max) &&
    isNullableNumberArray(daily.temperature_2m_min) &&
    isNullableNumberArray(daily.precipitation_sum) &&
    isNullableNumberArray(daily.rain_sum) &&
    isNullableNumberArray(daily.precipitation_probability_max) &&
    isNullableNumberArray(daily.wind_speed_10m_max) &&
    isNullableNumberArray(daily.wind_gusts_10m_max) &&
    isNullableStringArray(daily.sunrise) &&
    isNullableStringArray(daily.sunset)
  );
}

async function fetchOpenMeteo(location: FarmWeatherInput): Promise<OpenMeteoResponse> {
  const url = new URL(OPEN_METEO_URL);
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m',
    hourly: 'temperature_2m,weather_code,precipitation_probability,is_day',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,sunrise,sunset',
    forecast_days: String(FORECAST_DAYS),
    timezone: 'auto',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
  }).toString();

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch (error) {
    console.error('Open-Meteo request failed:', error);
    throw new WeatherProviderError('The weather service could not be reached. Please try again later.');
  }

  if (!response.ok) {
    console.error('Open-Meteo returned an error:', response.status);
    throw new WeatherProviderError('The weather service is temporarily unavailable. Please try again later.');
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (error) {
    console.error('Open-Meteo returned invalid JSON:', error);
    throw new WeatherProviderError('The weather service returned an invalid forecast.');
  }

  if (!isOpenMeteoResponse(data)) {
    throw new WeatherProviderError('The weather service returned an incomplete forecast.');
  }

  const dailyCount = data.daily.time.length;
  const hourlyCount = data.hourly.time.length;
  const hourlyArrays = [
    data.hourly.temperature_2m,
    data.hourly.weather_code,
    data.hourly.precipitation_probability,
    data.hourly.is_day,
  ];
  const dailyArrays = [
    data.daily.weather_code,
    data.daily.temperature_2m_max,
    data.daily.temperature_2m_min,
    data.daily.precipitation_sum,
    data.daily.rain_sum,
    data.daily.precipitation_probability_max,
    data.daily.wind_speed_10m_max,
    data.daily.wind_gusts_10m_max,
    data.daily.sunrise,
    data.daily.sunset,
  ];
  if (
    dailyCount !== FORECAST_DAYS ||
    dailyArrays.some((items) => items.length !== dailyCount) ||
    hourlyCount === 0 ||
    hourlyArrays.some((items) => items.length !== hourlyCount)
  ) {
    throw new WeatherProviderError('The weather service returned an incomplete forecast.');
  }

  return data;
}

function toForecast(
  farm: FarmWeatherInput,
  weather: OpenMeteoResponse,
): FarmWeatherForecast {
  const location: FarmWeatherLocation = {
    name: farm.locationName,
    latitude: farm.latitude,
    longitude: farm.longitude,
  };
  const currentData = weather.current;
  const current: CurrentWeather = {
    time: currentData.time,
    description: describeWeatherCode(currentData.weather_code) ?? 'Conditions unavailable',
    temperatureC: currentData.temperature_2m,
    feelsLikeC: currentData.apparent_temperature,
    relativeHumidityPercent: currentData.relative_humidity_2m,
    precipitationMm: currentData.precipitation,
    rainMm: currentData.rain,
    showersMm: currentData.showers,
    snowfallCm: currentData.snowfall,
    weatherCode: currentData.weather_code,
    cloudCoverPercent: currentData.cloud_cover,
    windSpeedKmh: currentData.wind_speed_10m,
    windDirectionDegrees: currentData.wind_direction_10m,
    isDay: currentData.is_day === 1,
  };

  const at = <T,>(values: readonly T[], index: number): T => {
    const value = values[index];
    if (value === undefined) {
      throw new WeatherProviderError('The weather service returned an incomplete forecast.');
    }
    return value;
  };
  const hourlyStart = weather.hourly.time.findIndex((time) => time >= currentData.time);
  const hourly: HourlyWeather[] = weather.hourly.time
    .map((time, index) => ({
      time,
      temperatureC: at(weather.hourly.temperature_2m, index),
      weatherCode: at(weather.hourly.weather_code, index),
      precipitationProbabilityPercent: at(weather.hourly.precipitation_probability, index),
      isDay: at(weather.hourly.is_day, index) === 1,
    }))
    .slice(hourlyStart < 0 ? 0 : hourlyStart, (hourlyStart < 0 ? 0 : hourlyStart) + 11);
  const daily: DailyWeather[] = weather.daily.time.map((date, index) => ({
    date,
    weatherCode: at(weather.daily.weather_code, index),
    description: describeWeatherCode(at(weather.daily.weather_code, index)),
    temperatureMaxC: at(weather.daily.temperature_2m_max, index),
    temperatureMinC: at(weather.daily.temperature_2m_min, index),
    precipitationMm: at(weather.daily.precipitation_sum, index),
    rainMm: at(weather.daily.rain_sum, index),
    precipitationProbabilityPercent: at(weather.daily.precipitation_probability_max, index),
    windSpeedMaxKmh: at(weather.daily.wind_speed_10m_max, index),
    windGustsMaxKmh: at(weather.daily.wind_gusts_10m_max, index),
    sunrise: at(weather.daily.sunrise, index),
    sunset: at(weather.daily.sunset, index),
  }));

  return { location, timezone: weather.timezone, current, hourly, daily };
}

/** Gets the authenticated farmer's saved farm and its local seven-day Open-Meteo forecast. */
export async function getFarmWeatherForecast(
  env: Env,
  ownerId: string,
  userIdToken: string,
): Promise<FarmWeatherForecast> {
  const document = await getDocument(env, { kind: 'user', accessToken: userIdToken }, `farms/${ownerId}`)
    .catch((error: unknown) => {
      if (error instanceof FirestoreRestError && error.status === 404) {
        throw new FarmNotFoundError();
      }
      throw error;
    });
  const farm = readFarmLocation(document);
  const forecast = await fetchOpenMeteo(farm);
  return toForecast(farm, forecast);
}
