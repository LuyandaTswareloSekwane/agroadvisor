export interface FarmWeatherLocation {
  name: string;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  time: string;
  description: string;
  temperatureC: number;
  feelsLikeC: number;
  relativeHumidityPercent: number;
  precipitationMm: number;
  rainMm: number;
  showersMm: number;
  snowfallCm: number;
  weatherCode: number;
  cloudCoverPercent: number;
  windSpeedKmh: number;
  windDirectionDegrees: number;
  isDay: boolean;
}

export interface DailyWeather {
  date: string;
  weatherCode: number | null;
  description: string | null;
  temperatureMaxC: number | null;
  temperatureMinC: number | null;
  precipitationMm: number | null;
  rainMm: number | null;
  precipitationProbabilityPercent: number | null;
  windSpeedMaxKmh: number | null;
  windGustsMaxKmh: number | null;
  sunrise: string | null;
  sunset: string | null;
}

export interface HourlyWeather {
  time: string;
  temperatureC: number | null;
  weatherCode: number | null;
  precipitationProbabilityPercent: number | null;
  isDay: boolean;
}

export interface FarmWeatherForecast {
  location: FarmWeatherLocation;
  timezone: string;
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
}

export interface RegionalTemperaturePoint {
  latitude: number;
  longitude: number;
  temperatureC: number;
}
