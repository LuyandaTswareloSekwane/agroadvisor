import type { FarmWeatherForecast } from '../../types/weather';
import { translateWeatherDescription } from '../../i18n';
import { useLanguage } from '../../hooks/useLanguage';

interface WeatherOverviewProps {
  forecast: FarmWeatherForecast;
}

function isRain(code: number): boolean {
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
}

function isSnow(code: number): boolean {
  return (code >= 71 && code <= 77) || code === 85 || code === 86;
}

function isCloudy(code: number): boolean {
  return code === 2 || code === 3 || code === 45 || code === 48;
}

function isStorm(code: number): boolean {
  return code >= 95;
}

export function WeatherGlyph({ code, isDay, className = '' }: { code: number; isDay: boolean; className?: string }) {
  if (code === 0 || code === 1) {
    return isDay ? (
      <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
        <circle cx="32" cy="32" r="12" fill="currentColor" />
        <path d="M32 5v8m0 38v8M5 32h8m38 0h8M13 13l6 6m26 26 6 6m0-38-6 6M19 45l-6 6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ) : (
      <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
        <path d="M43 42A21 21 0 0 1 22 13a21 21 0 1 0 30 25c-3 2-6 4-9 4Z" fill="currentColor" />
      </svg>
    );
  }

  if (isStorm(code)) {
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
        <path d="M15 38h34a10 10 0 0 0 0-20 15 15 0 0 0-29-2 11 11 0 0 0-5 22Z" fill="currentColor" />
        <path d="m34 34-8 14h8l-3 12 13-18h-9l4-8Z" fill="#facc15" stroke="#facc15" strokeLinejoin="round" />
      </svg>
    );
  }

  if (isRain(code) || isSnow(code)) {
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
        <path d="M14 37h36a10 10 0 0 0 0-20 15 15 0 0 0-29-2 11 11 0 0 0-7 22Z" fill="currentColor" />
        {isSnow(code) ? (
          <path d="M23 45v12m-5-9 10 6m0-6-10 6m21-9v12m-5-9 10 6m0-6-10 6" stroke="#dbeafe" strokeWidth="2.5" strokeLinecap="round" />
        ) : (
          <path d="m24 44-3 8m16-8-3 8m16-8-3 8" stroke="#bae6fd" strokeWidth="3" strokeLinecap="round" />
        )}
      </svg>
    );
  }

  if (isCloudy(code)) {
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
        <path d="M14 39h36a10 10 0 0 0 0-20 15 15 0 0 0-29-2 11 11 0 0 0-7 22Z" fill="currentColor" />
        {code === 45 || code === 48 ? (
          <path d="M17 47h32m-27 7h22" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
        ) : null}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="15" fill="currentColor" />
    </svg>
  );
}

function formatValue(value: number | null | undefined, suffix = ''): string {
  return value === null || value === undefined ? '—' : `${Math.round(value)}${suffix}`;
}

export function WeatherOverview({ forecast }: WeatherOverviewProps) {
  const { language, t } = useLanguage();
  const { current } = forecast;
  const today = forecast.daily.find((day) => day.date === current.time.slice(0, 10)) ?? forecast.daily[0];
  const description = translateWeatherDescription(language, current.weatherCode, current.description);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-white/95 via-wheat-50/95 to-leaf-50/95 p-4 shadow-2xl shadow-leaf-900/20 backdrop-blur-md sm:p-5" role="group" aria-label={t('weather.title')}>
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-citrus-300/30 blur-2xl" aria-hidden="true" />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-leaf-800">{t('weather.title')}</p>
            <p className="mt-1 text-sm font-semibold text-soil-600">{forecast.location.name}</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-citrus-300/50 to-sky-100 text-amber-500 shadow-inner transition-transform motion-safe:hover:animate-bounce">
            <WeatherGlyph code={current.weatherCode} isDay={current.isDay} className="h-10 w-10" />
          </div>
        </div>
        <div className="mt-4 flex items-end gap-3">
          <p className="bg-gradient-to-r from-leaf-900 via-leaf-700 to-citrus-500 bg-clip-text text-5xl font-black leading-none tracking-tight text-transparent">
            {Math.round(current.temperatureC)}°
          </p>
          <div className="pb-0.5">
            <p className="text-xs font-bold uppercase tracking-wider text-soil-500">°C</p>
            <p className="mt-1 text-sm font-bold text-soil-800">{description}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/75 px-2.5 py-2 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-soil-500">{t('weather.weekHighLow')}</p>
            <p className="mt-1 text-sm font-extrabold text-soil-900">
              {formatValue(today?.temperatureMaxC, '°')} <span className="font-medium text-soil-500">/ {formatValue(today?.temperatureMinC, '°')}</span>
            </p>
          </div>
          <div className="rounded-2xl bg-white/75 px-2.5 py-2 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-soil-500">{t('weather.humidity')}</p>
            <p className="mt-1 text-sm font-extrabold text-soil-900">{Math.round(current.relativeHumidityPercent)}%</p>
          </div>
          <div className="rounded-2xl bg-white/75 px-2.5 py-2 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-soil-500">{t('weather.feelsLike')}</p>
            <p className="mt-1 text-sm font-extrabold text-soil-900">{Math.round(current.feelsLikeC)}°</p>
          </div>
        </div>
      </div>
    </div>
  );
}
