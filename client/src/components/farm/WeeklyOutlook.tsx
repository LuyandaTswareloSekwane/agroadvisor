import type { FarmWeatherForecast } from '../../types/weather';
import { formatForecastDate, getPrimaryWeatherAlert, getWeatherAlertForecastDate, type WeatherAdviceAlert } from '../../utils/weatherAdvice';
import { translateWeatherDescription } from '../../i18n';
import { useLanguage } from '../../hooks/useLanguage';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { WeatherGlyph } from './WeatherOverview';

interface WeeklyOutlookProps {
  forecast: FarmWeatherForecast;
  alerts: WeatherAdviceAlert[];
  onRefresh: () => void;
}

function formatValue(value: number | null, suffix = ''): string {
  return value === null ? '—' : `${Math.round(value)}${suffix}`;
}

export function WeeklyOutlook({ forecast, alerts, onRefresh }: WeeklyOutlookProps) {
  const { language, t } = useLanguage();
  const primaryAlert = getPrimaryWeatherAlert(alerts);
  const otherRiskDays = new Set(alerts.map((alert) => alert.date)).size - (primaryAlert ? 1 : 0);
  const forecastDays = Math.min(forecast.daily.length, 7);
  const progressPercent = (forecastDays / 7) * 100;

  return (
    <Card className="space-y-5 border-leaf-100 bg-gradient-to-br from-white via-leaf-50/70 to-wheat-50/80 sm:p-7">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-leaf-900">{t('weather.weekTitle')}</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-citrus-300/70 bg-gradient-to-r from-wheat-100 to-citrus-300/40 px-2.5 py-1 text-[11px] font-extrabold text-soil-800 shadow-sm">
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-citrus-500" fill="currentColor" aria-hidden="true">
                <path d="M10 1.8 12.5 7l5.7.8-4.1 4 1 5.7L10 14.8l-5.1 2.7 1-5.7-4.1-4L7.5 7 10 1.8Z" />
              </svg>
              {t(forecastDays === 7 ? 'weather.weekComplete' : 'weather.weekQuest')}
            </span>
          </div>
          <p className="mt-1 text-sm text-soil-600">{t('weather.weekIntro')}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onRefresh}>
          {t('weather.refresh')}
        </Button>
      </header>

      <div
        className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm sm:flex sm:items-center sm:gap-4 sm:px-4"
        role="group"
        aria-label={t('weather.weekProgress', { count: forecastDays })}
      >
        <div className="flex items-center justify-between gap-3 sm:min-w-44">
          <span className="text-sm font-bold text-soil-800">{t('weather.weekProgress', { count: forecastDays })}</span>
          <span className="text-xs font-extrabold tabular-nums text-leaf-800 sm:hidden">{forecastDays}/7</span>
        </div>
        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-soil-100 sm:mt-0 sm:flex-1"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={7}
          aria-valuenow={forecastDays}
          aria-label={t('weather.weekProgress', { count: forecastDays })}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-leaf-500 via-emerald-400 to-citrus-400 transition-[width] duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-2 hidden items-center gap-1 sm:mt-0 sm:flex" aria-hidden="true">
          {Array.from({ length: 7 }, (_, index) => (
            <span
              key={index}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-extrabold ${
                index < forecastDays
                  ? 'bg-gradient-to-br from-leaf-500 to-emerald-400 text-white shadow-sm'
                  : 'bg-soil-100 text-soil-400'
              }`}
            >
              {index < forecastDays ? '✓' : index + 1}
            </span>
          ))}
        </div>
      </div>

      {primaryAlert ? (
        <div
          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
            primaryAlert.severity === 'critical'
              ? 'border-red-200 bg-red-50 text-red-950'
              : 'border-amber-200 bg-amber-50 text-soil-900'
          }`}
          role="alert"
        >
          <svg
            viewBox="0 0 48 48"
            className={`h-9 w-9 shrink-0 ${
              primaryAlert.severity === 'critical' ? 'text-red-700' : 'text-amber-700'
            }`}
            fill="none"
            aria-hidden="true"
          >
            <path d="M24 5 3.8 41h40.4L24 5Z" fill="currentColor" />
            <path d="M24 17v11" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <circle cx="24" cy="34" r="2" fill="white" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-soil-600">
              {primaryAlert.severity === 'critical' ? t('weather.severeWarning') : t('weather.warning')}
            </p>
            <p className="font-bold leading-5">{primaryAlert.title}</p>
            <p className="text-sm text-soil-700">{primaryAlert.date}</p>
          </div>
          {otherRiskDays > 0 && (
            <span className="hidden shrink-0 text-xs font-semibold text-soil-600 sm:inline">
              {t('weather.otherRiskDays', { count: otherRiskDays })}
            </span>
          )}
        </div>
      ) : (
        <p className="rounded-lg bg-leaf-50 px-3 py-2 text-sm font-medium text-leaf-800">
          {t('weather.noRisk')}
        </p>
      )}

      {forecast.daily.length === 0 ? (
        <p className="rounded-xl bg-soil-50 p-4 text-sm text-soil-700">{t('weather.weekEmpty')}</p>
      ) : (
        <ul className="grid auto-cols-[9.5rem] grid-flow-col gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:auto-cols-fr sm:grid-flow-row sm:grid-cols-4 lg:grid-cols-7">
          {forecast.daily.map((day, index) => {
            const dayAlerts = alerts.filter((alert) => getWeatherAlertForecastDate(alert) === day.date);
            const primaryDayAlert = getPrimaryWeatherAlert(dayAlerts);
            const description = day.weatherCode === null || day.description === null
              ? null
              : translateWeatherDescription(language, day.weatherCode, day.description);
            const low = day.temperatureMinC;
            const high = day.temperatureMaxC;

            return (
              <li
                key={day.date}
                className={`group relative min-w-0 snap-start overflow-hidden rounded-2xl border p-3 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  primaryDayAlert
                    ? 'border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50'
                    : index % 2 === 0
                      ? 'border-sky-100 bg-gradient-to-br from-sky-50 via-white to-leaf-50'
                      : 'border-leaf-100 bg-gradient-to-br from-leaf-50 via-white to-wheat-50'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <h3 className="min-w-0 truncate text-xs font-extrabold leading-5 text-soil-800">
                    {formatForecastDate(day.date, language)}
                  </h3>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/90 text-[10px] font-extrabold text-leaf-800 shadow-sm">
                    {index + 1}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <WeatherGlyph
                    code={day.weatherCode ?? 3}
                    isDay
                    className="h-10 w-10 text-amber-500 transition-transform duration-200 motion-safe:group-hover:animate-bounce"
                  />
                  <p className="text-right text-lg font-black tabular-nums tracking-tight text-soil-900">
                    {formatValue(high, '°')}
                    <span className="ml-1 text-xs font-semibold text-soil-500">/ {formatValue(low, '°')}</span>
                  </p>
                </div>
                <p className="mt-1 min-h-8 text-xs font-medium leading-4 text-soil-600">{description ?? '—'}</p>
                <div className="mt-3 flex items-center justify-between border-t border-soil-200/70 pt-2 text-[10px] font-bold">
                  <span className="text-sky-800">{t('weather.weekRainChance')}</span>
                  <span className="rounded-full bg-white/80 px-2 py-1 tabular-nums text-sky-900">
                    {formatValue(day.precipitationProbabilityPercent, '%')}
                  </span>
                </div>
                {primaryDayAlert && (
                  <details className="mt-2 rounded-xl border border-amber-200 bg-white/80 px-2.5 py-2">
                    <summary className="cursor-pointer text-[11px] font-bold leading-4 text-soil-900">
                      {t('weather.weekRisk', { title: primaryDayAlert.title })}
                    </summary>
                    <p className="mt-2 text-sm leading-5 text-soil-800">{primaryDayAlert.advice}</p>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
