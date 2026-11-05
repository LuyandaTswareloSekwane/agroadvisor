import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Farm, FarmFormValues } from '../src/types/farm';
import type { DailyWeather, FarmWeatherForecast } from '../src/types/weather';
import { getPrimaryWeatherAlert, getWeatherAdvice, isWeatherAlertImminent } from '../src/utils/weatherAdvice';
import { PASSWORD_MIN_LENGTH, validateFarm, validateLogin, validateRegister } from '../src/utils/validation';

const TODAY = '2026-11-05';

const farm = {
  ownerId: 'u1',
  name: 'Test Farm',
  locationName: 'Kimberley',
  location: { latitude: -28.74, longitude: 24.77 },
  sizeHectares: 5,
  crops: ['maize'],
  livestock: { cattle: 3 },
  photoDataUrl: null,
} as unknown as Farm;

function day(overrides: Partial<DailyWeather>, date = '2026-11-07'): DailyWeather {
  return {
    date,
    weatherCode: 1,
    description: 'Mainly clear',
    temperatureMaxC: 28,
    temperatureMinC: 14,
    precipitationMm: 0,
    rainMm: 0,
    precipitationProbabilityPercent: 0,
    windSpeedMaxKmh: 15,
    windGustsMaxKmh: 25,
    sunrise: null,
    sunset: null,
    ...overrides,
  };
}

function forecast(days: DailyWeather[], currentTemp = 24): FarmWeatherForecast {
  return {
    location: { name: 'Kimberley', latitude: -28.74, longitude: 24.77 },
    timezone: 'Africa/Johannesburg',
    current: {
      time: `${TODAY}T12:00`,
      description: 'Clear',
      temperatureC: currentTemp,
      feelsLikeC: currentTemp,
      relativeHumidityPercent: 30,
      precipitationMm: 0,
      rainMm: 0,
      showersMm: 0,
      snowfallCm: 0,
      weatherCode: 0,
      cloudCoverPercent: 0,
      windSpeedKmh: 10,
      windDirectionDegrees: 180,
      isDay: true,
    },
    hourly: [],
    daily: days,
  };
}

const hazardIds = (days: DailyWeather[]) => getWeatherAdvice(forecast(days), farm).map((a) => a.id.split(':')[0]);

test('TC-U01 a calm forecast produces no alerts', () => {
  assert.equal(getWeatherAdvice(forecast([day({})]), farm).length, 0);
});

test('TC-U02 heat alert triggers at 35 C but not at 34.9 C', () => {
  assert.equal(hazardIds([day({ temperatureMaxC: 34.9 })]).length, 0);
  assert.ok(hazardIds([day({ temperatureMaxC: 35 })]).length > 0);
});

test('TC-U03 frost alert triggers at 2 C but not at 2.1 C', () => {
  assert.equal(hazardIds([day({ temperatureMinC: 2.1 })]).length, 0);
  assert.ok(hazardIds([day({ temperatureMinC: 2 })]).length > 0);
});

test('TC-U04 heavy rain triggers at 50 mm, or at 30 mm with 70% probability', () => {
  assert.equal(hazardIds([day({ precipitationMm: 49.9, precipitationProbabilityPercent: 20 })]).length, 0);
  assert.ok(hazardIds([day({ precipitationMm: 50 })]).length > 0);
  assert.equal(hazardIds([day({ precipitationMm: 30, precipitationProbabilityPercent: 69 })]).length, 0);
  assert.ok(hazardIds([day({ precipitationMm: 30, precipitationProbabilityPercent: 70 })]).length > 0);
});

test('TC-U05 damaging wind triggers at 60 km/h gusts but not at 59 km/h', () => {
  assert.equal(hazardIds([day({ windGustsMaxKmh: 59 })]).length, 0);
  assert.ok(hazardIds([day({ windGustsMaxKmh: 60 })]).length > 0);
});

test('TC-U06 thunderstorm weather codes (95, 96, 99) trigger an alert; code 80 does not', () => {
  for (const code of [95, 96, 99]) assert.ok(hazardIds([day({ weatherCode: code })]).length > 0, `code ${code}`);
  assert.equal(hazardIds([day({ weatherCode: 80 })]).length, 0);
});

test('TC-U07 missing (null) forecast values never raise an alert', () => {
  const empty = day({
    temperatureMaxC: null,
    temperatureMinC: null,
    precipitationMm: null,
    windGustsMaxKmh: null,
    weatherCode: null,
  });
  assert.equal(hazardIds([empty]).length, 0);
});

test('TC-U08 the primary alert is the soonest, and critical wins a tie on the same day', () => {
  const alerts = [
    { id: 'wind:2026-11-09', date: '', title: '', advice: '', severity: 'warning' as const },
    { id: 'heat:2026-11-06', date: '', title: '', advice: '', severity: 'warning' as const },
    { id: 'rain:2026-11-06', date: '', title: '', advice: '', severity: 'critical' as const },
  ];
  assert.equal(getPrimaryWeatherAlert(alerts)?.id, 'rain:2026-11-06');
  assert.equal(getPrimaryWeatherAlert([]), null);
});

test('TC-U09 the pop-up opens only for a hazard due today or tomorrow', () => {
  const now = `${TODAY}T08:00`;
  const at = (date: string) => ({ id: `heat:${date}`, date, title: '', advice: '', severity: 'warning' as const });
  assert.equal(isWeatherAlertImminent(at('2026-11-05'), now), true);
  assert.equal(isWeatherAlertImminent(at('2026-11-06'), now), true);
  assert.equal(isWeatherAlertImminent(at('2026-11-07'), now), false);
  assert.equal(isWeatherAlertImminent(at('2026-11-04'), now), false);
});

const validFarm: FarmFormValues = {
  name: 'Test Farm',
  locationName: 'Kimberley',
  latitude: '-28.74',
  longitude: '24.77',
  sizeHectares: '5',
  crops: ['maize'],
  livestock: { cattle: '3' },
  photoDataUrl: null,
};

const hasErrors = (errors: object) => Object.values(errors).some(Boolean);

test('TC-U10 a complete farm profile passes validation', () => {
  assert.equal(hasErrors(validateFarm(validFarm)), false);
});

test('TC-U11 farm validation rejects missing name, town, location and size', () => {
  const errors = validateFarm({ ...validFarm, name: ' ', locationName: '', latitude: '', longitude: '', sizeHectares: '' });
  for (const field of ['name', 'locationName', 'latitude', 'longitude', 'sizeHectares'] as const) {
    assert.ok(errors[field], field);
  }
});

test('TC-U12 farm size and coordinate boundaries', () => {
  assert.ok(validateFarm({ ...validFarm, sizeHectares: '0' }).sizeHectares);
  assert.ok(validateFarm({ ...validFarm, sizeHectares: '-1' }).sizeHectares);
  assert.ok(validateFarm({ ...validFarm, sizeHectares: '10001' }).sizeHectares);
  assert.equal(validateFarm({ ...validFarm, sizeHectares: '10000' }).sizeHectares, undefined);
  assert.ok(validateFarm({ ...validFarm, latitude: '90.1' }).latitude);
  assert.ok(validateFarm({ ...validFarm, longitude: '-180.1' }).longitude);
  assert.ok(validateFarm({ ...validFarm, latitude: 'abc' }).latitude);
});

test('TC-U13 a farm needs at least one crop or animal, and animal counts must be whole numbers', () => {
  assert.ok(validateFarm({ ...validFarm, crops: [], livestock: {} }).crops);
  assert.ok(validateFarm({ ...validFarm, crops: [], livestock: { cattle: '0' } }).crops);
  assert.equal(validateFarm({ ...validFarm, crops: [], livestock: { goats: '4' } }).crops, undefined);
  assert.ok(validateFarm({ ...validFarm, livestock: { cattle: '2.5' } }).livestock);
  assert.ok(validateFarm({ ...validFarm, livestock: { cattle: '-1' } }).livestock);
});

test('TC-U14 login validation rejects an empty or malformed email and an empty password', () => {
  assert.ok(validateLogin({ email: '', password: 'x' }).email);
  assert.ok(validateLogin({ email: 'not-an-email', password: 'x' }).email);
  assert.ok(validateLogin({ email: 'a@b.co', password: '' }).password);
  assert.equal(hasErrors(validateLogin({ email: 'a@b.co', password: 'secret' })), false);
});

test('TC-U15 registration validation: name, password length and matching passwords', () => {
  const ok = { fullName: 'Thandi Nkosi', email: 'thandi@example.com', password: 'abcdefgh', confirmPassword: 'abcdefgh' };
  assert.equal(hasErrors(validateRegister(ok)), false);
  assert.ok(validateRegister({ ...ok, fullName: '  ' }).fullName);
  assert.ok(validateRegister({ ...ok, password: 'a'.repeat(PASSWORD_MIN_LENGTH - 1), confirmPassword: 'a'.repeat(PASSWORD_MIN_LENGTH - 1) }).password);
  assert.ok(validateRegister({ ...ok, confirmPassword: 'different1' }).confirmPassword);
});
