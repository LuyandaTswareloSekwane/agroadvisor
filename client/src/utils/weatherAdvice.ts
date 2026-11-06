import { WEATHER_RISK_THRESHOLDS } from '../../../config/knowledge-base/weather-risks';
import type { Farm } from '../types/farm';
import type { FarmWeatherForecast } from '../types/weather';
import { getCropLabel, getLivestockLabel } from './farmLabels';
import { LIVESTOCK } from '../../../config/knowledge-base/livestock';
import { translate, translateFarmTerm, type AppLanguage } from '../i18n';

export interface WeatherAdviceAlert {
  id: string;
  date: string;
  title: string;
  advice: string;
  severity: 'warning' | 'critical';
}

export type WeatherHazard = 'heat' | 'cold' | 'rain' | 'wind' | 'storm';

export function getWeatherAlertForecastDate(alert: WeatherAdviceAlert): string {
  return alert.id.slice(alert.id.lastIndexOf(':') + 1);
}

/** Selects one soonest risk so the main warning stays focused and actionable. */
export function getPrimaryWeatherAlert(alerts: WeatherAdviceAlert[]): WeatherAdviceAlert | null {
  return [...alerts].sort((first, second) => {
    const dateOrder = getWeatherAlertForecastDate(first).localeCompare(getWeatherAlertForecastDate(second));
    if (dateOrder !== 0) return dateOrder;
    return first.severity === second.severity
      ? 0
      : first.severity === 'critical' ? -1 : 1;
  })[0] ?? null;
}

/** Only open an interruptive warning for a hazard due today or tomorrow. */
export function isWeatherAlertImminent(alert: WeatherAdviceAlert, currentTime: string): boolean {
  const alertDate = new Date(`${getWeatherAlertForecastDate(alert)}T00:00:00Z`).getTime();
  const currentDate = new Date(`${currentTime.slice(0, 10)}T00:00:00Z`).getTime();
  const daysUntil = (alertDate - currentDate) / 86_400_000;
  return Number.isFinite(daysUntil) && daysUntil >= 0 && daysUntil <= 1;
}

export function isWeatherHazard(value: string): value is WeatherHazard {
  return value === 'heat' || value === 'cold' || value === 'rain' || value === 'wind' || value === 'storm';
}

const WEEKDAYS: Record<AppLanguage, readonly string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  af: ['Sondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrydag', 'Saterdag'],
  zu: ['iSonto', 'uMsombuluko', 'uLwesibili', 'uLwesithathu', 'uLwesine', 'uLwesihlanu', 'uMgqibelo'],
  st: ['Sontaha', 'Mantaha', 'Labobeli', 'Laboraro', 'Labone', 'Labohlano', 'Moqebelo'],
  tn: ['Tshipi', 'Mantaga', 'Labobedi', 'Laboraro', 'Labone', 'Labotlhano', 'Matlhatso'],
};

const MONTHS: Record<AppLanguage, readonly string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  af: ['Januarie', 'Februarie', 'Maart', 'April', 'Mei', 'Junie', 'Julie', 'Augustus', 'September', 'Oktober', 'November', 'Desember'],
  zu: ['uMasingana', 'uNhlolanja', 'uNdasa', 'uMbaso', 'uNhlaba', 'uNhlangulana', 'uNtulikazi', 'uNcwaba', 'uMandulo', 'uMfumfu', 'uLwezi', 'uZibandlela'],
  st: ['Pherekhong', 'Hlakola', 'Hlakubele', 'Mesa', 'Motsheanong', 'Phuptjane', 'Phupu', 'Phato', 'Loetse', 'Mphalane', 'Pulungoana', 'Tshitwe'],
  tn: ['Ferikgong', 'Tlhakole', 'Mopitlwe', 'Moranang', 'Motsheganong', 'Seetebosigo', 'Phukwi', 'Phatwe', 'Lwetse', 'Diphalane', 'Ngwanatsele', 'Sedimonthole'],
};

export function formatForecastDate(date: string, language: AppLanguage): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  const weekday = WEEKDAYS[language][parsed.getUTCDay()];
  const month = MONTHS[language][parsed.getUTCMonth()];
  const day = parsed.getUTCDate();
  return language === 'en'
    ? `${weekday}, ${day} ${month}`
    : `${weekday} ${day} ${month}`;
}

/** Day, month name and optional year in the chosen language, using the app's own month names because browsers lack zu/st/tn data. */
export function formatLocalizedDate(date: Date, language: AppLanguage, withYear = true): string {
  const text = `${date.getDate()} ${MONTHS[language][date.getMonth()]}`;
  return withYear ? `${text} ${date.getFullYear()}` : text;
}

function joinNames(names: string[]): string {
  if (names.length < 2) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function getAdvice(hazard: WeatherHazard, farm: Farm, language: AppLanguage): string {
  const crops = farm.crops.map((crop) =>
    translateFarmTerm(language, getCropLabel(crop)).toLocaleLowerCase(),
  );
  const animals = Object.entries(farm.livestock)
    .filter((entry) => typeof entry[1] === 'number' && entry[1] > 0)
    .map(([id]) => {
      const animal = LIVESTOCK.find((item) => item.id === id);
      return translateFarmTerm(language, animal ? getLivestockLabel(animal.id) : id).toLocaleLowerCase();
    });
  const farmFocus = translate(language, 'guide.farmFocus', {
    crops: crops.length > 0 ? joinNames(crops) : translate(language, 'guide.genericCrops'),
    animals: animals.length > 0 ? joinNames(animals) : translate(language, 'guide.genericAnimals'),
  });
  const withFarmFocus = (advice: string) => `${farmFocus} ${advice}`;

  switch (hazard) {
    case 'heat':
      return withFarmFocus([
        translate(language, 'guide.heat.shadeText'),
        translate(language, 'guide.heat.waterText'),
        translate(language, 'guide.heat.cropsText'),
      ].join(' '));
    case 'cold':
      return withFarmFocus(`${translate(language, 'guide.cold.cropsText')} ${translate(language, 'guide.cold.shelterText')}`);
    case 'rain':
      return withFarmFocus(`${translate(language, 'guide.rain.drainText')} ${translate(language, 'guide.rain.clearText')}`);
    case 'wind':
      return withFarmFocus(`${translate(language, 'guide.wind.secureText')} ${translate(language, 'guide.wind.shelterText')}`);
    case 'storm':
      return withFarmFocus(`${translate(language, 'guide.storm.shelterText')} ${translate(language, 'guide.storm.lightningText')}`);
  }
}

/** Greeting based on the farm-local current forecast time. */
export function getFarmGreeting(forecast: FarmWeatherForecast, language: AppLanguage = 'en'): string {
  const hour = Number(forecast.current.time.match(/T(\d{2}):/)?.[1]);
  if (language !== 'en') return translate(language, 'weather.warning');
  if (!Number.isFinite(hour)) return 'Weather warning';
  if (hour >= 5 && hour < 12) return 'Morning weather warning';
  if (hour >= 12 && hour < 17) return 'Afternoon weather warning';
  if (hour >= 17 && hour < 21) return 'Evening weather warning';
  return 'Overnight weather warning';
}

/** Turns farm-local forecast extremes into concise, actionable safety warnings. */
export function getWeatherAdvice(
  forecast: FarmWeatherForecast,
  farm: Farm,
  language: AppLanguage = 'en',
): WeatherAdviceAlert[] {
  const alerts: WeatherAdviceAlert[] = [];
  const seen = new Set<string>();
  function add(
    hazard: WeatherHazard,
    id: string,
    date: string,
    isCurrent: boolean,
    fallbackTitle: string,
    severity: WeatherAdviceAlert['severity'] = 'warning',
  ) {
    const key = `${id}:${date}`;
    if (seen.has(key)) return;
    seen.add(key);
    const displayDate = formatForecastDate(date, language);
    const phase = isCurrent ? 'now' : 'expected';
    const title = language === 'en'
      ? fallbackTitle
      : translate(language, `weather.${hazard}.${phase}`);
    alerts.push({
      id: key,
      date: displayDate,
      title,
      advice: getAdvice(hazard, farm, language),
      severity,
    });
  }

  const currentDate = forecast.current.time.slice(0, 10);
  if (forecast.current.temperatureC >= WEATHER_RISK_THRESHOLDS.highTemperatureC) {
    add(
      'heat',
      'heat',
      currentDate,
      true,
      'High heat now',
      'critical',
    );
  }
  if (forecast.current.temperatureC <= WEATHER_RISK_THRESHOLDS.lowTemperatureC) {
    add(
      'cold',
      'cold',
      currentDate,
      true,
      'Very cold conditions now',
      'critical',
    );
  }
  if (
    forecast.current.precipitationMm !== null &&
    forecast.current.precipitationMm >= WEATHER_RISK_THRESHOLDS.heavyRainMm
  ) {
    add(
      'rain',
      'rain',
      currentDate,
      true,
      'Heavy rain now',
      'critical',
    );
  }
  if (forecast.current.windSpeedKmh >= WEATHER_RISK_THRESHOLDS.damagingWindGustKmh) {
    add(
      'wind',
      'wind',
      currentDate,
      true,
      'Damaging winds now',
    );
  }
  if (
    forecast.current.weatherCode !== null &&
    WEATHER_RISK_THRESHOLDS.stormWeatherCodes.some((code) => code === forecast.current.weatherCode)
  ) {
    add(
      'storm',
      'storm',
      currentDate,
      true,
      'Thunderstorm now',
      'critical',
    );
  }

  for (const day of forecast.daily) {
    if (day.temperatureMaxC !== null && day.temperatureMaxC >= WEATHER_RISK_THRESHOLDS.highTemperatureC) {
      add(
        'heat',
        'heat',
        day.date,
        false,
        'High heat expected',
        'critical',
      );
    }
    if (day.temperatureMinC !== null && day.temperatureMinC <= WEATHER_RISK_THRESHOLDS.lowTemperatureC) {
      add(
        'cold',
        'cold',
        day.date,
        false,
        'Very cold temperatures expected',
        'critical',
      );
    }
    if (
      day.precipitationMm !== null &&
      (day.precipitationMm >= WEATHER_RISK_THRESHOLDS.heavyRainMm ||
        (day.precipitationMm >= WEATHER_RISK_THRESHOLDS.probableHeavyRainMm &&
          day.precipitationProbabilityPercent !== null &&
          day.precipitationProbabilityPercent >= WEATHER_RISK_THRESHOLDS.heavyRainProbabilityPercent))
    ) {
      add(
        'rain',
        'rain',
        day.date,
        false,
        'Heavy rain and possible flooding',
        'critical',
      );
    }
    if (
      day.windGustsMaxKmh !== null &&
      day.windGustsMaxKmh >= WEATHER_RISK_THRESHOLDS.damagingWindGustKmh
    ) {
      add(
        'wind',
        'wind',
        day.date,
        false,
        'Damaging wind gusts expected',
      );
    }
    if (
      day.weatherCode !== null &&
      WEATHER_RISK_THRESHOLDS.stormWeatherCodes.some((code) => code === day.weatherCode)
    ) {
      add(
        'storm',
        'storm',
        day.date,
        false,
        'Thunderstorm expected',
        'critical',
      );
    }
  }

  return alerts;
}
