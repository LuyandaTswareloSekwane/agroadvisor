import type { Farm } from '../../types/farm';
import type { FarmWeatherForecast } from '../../types/weather';
import { hectaresToAcres } from '../../utils/farmForm';
import { WeatherOverview } from './WeatherOverview';
import { ButtonLink } from '../ui/ButtonLink';
import { useLanguage } from '../../hooks/useLanguage';
import { LANGUAGE_LOCALES } from '../../i18n';

interface FarmSummaryProps {
  farm: Farm;
  firstName?: string;
  forecast: FarmWeatherForecast | null;
}

/** Compact dashboard header combining the farmer, farm, and current conditions. */
export function FarmSummary({ farm, firstName, forecast }: FarmSummaryProps) {
  const { language, t } = useLanguage();
  const farmSizeAcres = new Intl.NumberFormat(LANGUAGE_LOCALES[language], { maximumFractionDigits: 2 })
    .format(hectaresToAcres(farm.sizeHectares));
  const farmImage = farm.photoDataUrl || '/farm-hero.jpg';

  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-leaf-900 via-leaf-800 to-emerald-500 shadow-xl shadow-leaf-900/20">
      <img src={farmImage} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-leaf-900/95 via-leaf-900/85 to-leaf-800/35"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -right-12 -top-20 -z-10 h-64 w-64 rounded-full bg-citrus-300/25 blur-3xl" aria-hidden="true" />
      <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.8fr)] lg:items-center lg:gap-10 lg:p-9">
        <div className="min-w-0 py-1 text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide text-white/95 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-citrus-300" fill="none" aria-hidden="true">
              <path d="M20 4c-8 0-13 3.2-13 9a5 5 0 0 0 5 5c5.8 0 8-6 8-14Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M4 21c2-5 5-8 10-11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span>{farm.locationName}</span>
          </div>
          <p className="mt-5 bg-gradient-to-r from-citrus-300 via-wheat-100 to-emerald-200 bg-clip-text text-sm font-extrabold text-transparent">
            {firstName ? t('dashboard.welcome', { name: firstName }) : t('dashboard.welcomePlain')}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="max-w-full truncate text-3xl font-extrabold tracking-tight text-white transition-transform motion-safe:hover:animate-bounce sm:text-4xl">
              {farm.name}
            </h1>
            <ButtonLink to="/farm" variant="inverse" size="sm">
              {t('farm.edit')}
            </ButtonLink>
          </div>
          <p className="mt-2 text-sm font-medium text-white/80">
            {t('farm.areaAcres', { size: farmSizeAcres })}
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-white/80">
            <span className="flex -space-x-1" aria-hidden="true">
              <span className="h-3 w-3 rounded-full border-2 border-leaf-900 bg-citrus-300" />
              <span className="h-3 w-3 rounded-full border-2 border-leaf-900 bg-leaf-300" />
              <span className="h-3 w-3 rounded-full border-2 border-leaf-900 bg-sky-300" />
            </span>
            <span>{t('weather.title')}</span>
          </div>
        </div>
        {forecast ? (
          <WeatherOverview forecast={forecast} />
        ) : (
          <div className="hidden min-h-32 rounded-3xl border border-white/30 bg-white/10 p-5 backdrop-blur-md lg:block" aria-hidden="true">
            <div className="h-3 w-24 animate-pulse rounded-full bg-white/35" />
            <div className="mt-5 h-10 w-32 animate-pulse rounded-xl bg-white/40" />
            <div className="mt-4 h-3 w-48 animate-pulse rounded-full bg-white/25" />
          </div>
        )}
      </div>
    </section>
  );
}
