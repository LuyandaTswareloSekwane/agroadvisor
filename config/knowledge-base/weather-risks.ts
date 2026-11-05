/**
 * Weather risk thresholds for practical smallholder-farm alerts.
 * These are conservative warning triggers, not guarantees of crop or livestock damage.
 */
export const WEATHER_RISK_THRESHOLDS = {
  /** Sustained daytime heat can stress crops and livestock, especially without shade or water. */
  highTemperatureC: 35,
  /** Near-freezing overnight temperatures can damage tender crops and expose young animals to cold. */
  lowTemperatureC: 2,
  /** Daily rain at this level can cause waterlogging, runoff, and localized flooding. */
  heavyRainMm: 50,
  /** Lower rainfall can still be hazardous when the forecast probability is high. */
  probableHeavyRainMm: 30,
  heavyRainProbabilityPercent: 70,
  /** Strong gusts can damage crop supports and light farm structures. */
  damagingWindGustKmh: 60,
  stormWeatherCodes: [95, 96, 99],
  /** Temperature bands used to color the nearby-weather layer on the map. */
  mapTemperatureBandsC: [10, 25, 32],
} as const;
