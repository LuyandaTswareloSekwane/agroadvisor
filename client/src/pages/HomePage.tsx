import { Link } from 'react-router';
import { ButtonLink } from '../components/ui/ButtonLink';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

function FeatureArtwork({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 360 170" className="h-full w-full" aria-hidden="true">
        <circle cx="286" cy="48" r="27" fill="var(--color-citrus-300)" />
        <path d="M0 123c70-35 133-33 197 0s112 31 163 2v45H0z" fill="#8caf74" />
        <path d="M0 143c70-31 133-28 197 2s112 25 163 0v25H0z" fill="#3f7147" />
        <path d="M57 132V91m0 14c-19 0-27-9-27-25 18 0 27 9 27 25Zm0-13c0-20 10-29 29-29 0 19-10 29-29 29Zm43 13V76m0 30c-19 0-27-9-27-25 18 0 27 9 27 25Zm0-17c0-20 10-29 29-29 0 19-10 29-29 29Z" fill="none" stroke="#214b31" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M227 126V99m0 10c-13 0-19-6-19-18 12 0 19 6 19 18Zm0-10c0-13 7-19 19-19 0 12-7 19-19 19Z" fill="none" stroke="#214b31" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg viewBox="0 0 360 170" className="h-full w-full" aria-hidden="true">
        <circle cx="274" cy="76" r="55" fill="#f3c7ac" />
        <path d="M0 125c65-33 134-28 192 1s117 26 168-4v48H0z" fill="#d88a63" />
        <path d="M0 146c66-26 127-23 189 2s122 19 171-1v23H0z" fill="#bd5b3b" />
        <path d="m272 32 49 90h-98z" fill="#fffaf4" stroke="#98442c" strokeWidth="5" strokeLinejoin="round" />
        <path d="M272 60v28m0 14v2" stroke="#98442c" strokeWidth="7" strokeLinecap="round" />
        <path d="M72 120V91m0 17c-14 0-20-7-20-19 13 0 20 7 20 19Zm0-12c0-15 8-22 22-22 0 14-8 22-22 22Z" fill="none" stroke="#fffaf4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 360 170" className="h-full w-full" aria-hidden="true">
      <circle cx="276" cy="57" r="28" fill="#fffaf4" />
      <path d="M0 120c60-28 126-34 195-2s117 33 165 0v52H0z" fill="#a5c69f" />
      <path d="M0 146c70-24 126-27 192 0s117 27 168 1v23H0z" fill="#588b55" />
      <path d="M175 136c0-41 19-63 56-72-1 35-18 57-56 72Zm0-1c-4-35-25-52-62-53 5 31 26 49 62 53Zm3 1c16-34 44-44 78-32-14 29-40 41-78 32Z" fill="#2d603b" />
      <path d="M177 137v-45" stroke="#214b31" strokeWidth="5" strokeLinecap="round" />
      <path d="M57 131V94m0 17c-16 0-23-8-23-22 15 0 23 8 23 22Zm0-14c0-17 9-25 25-25 0 16-9 25-25 25Z" fill="none" stroke="#fffaf4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const highlights = [
    { number: '01', title: t('home.highlightAdvice') },
    { number: '02', title: t('home.highlightAlerts') },
    { number: '03', title: t('home.highlightField') },
  ];

  return (
    <div className="space-y-12 pb-4 sm:space-y-16">
      <section className="grid overflow-hidden rounded-[2rem] bg-soil-50 shadow-2xl shadow-leaf-900/15 lg:grid-cols-[28px_1fr]">
        <div className="hidden bg-leaf-900 lg:row-span-2 lg:block" aria-hidden="true" />
        <div className="relative min-h-[350px] overflow-hidden sm:min-h-[480px] lg:min-h-[540px]">
          <img
            src="/farm-hero.jpg"
            alt="Cultivated fields stretching toward the horizon at sunrise"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-leaf-950/15 via-transparent to-soil-950/10" aria-hidden="true" />
          <aside
            className="glass-surface absolute left-5 top-1/2 w-[calc(100%-2.5rem)] max-w-[390px] -translate-y-1/2 overflow-hidden rounded-[1.6rem] text-soil-900 shadow-2xl shadow-soil-950/25 sm:left-10"
            aria-label={t('home.previewLabel')}
          >
            <div className="flex items-center justify-between gap-4 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-terracotta-700">
                  {t('home.previewLabel')}
                </p>
                <h2 className="mt-1 text-base font-bold tracking-tight text-soil-900 sm:text-lg">
                  {t('weather.title')}
                </h2>
              </div>
              <svg viewBox="0 0 64 64" className="h-12 w-12 shrink-0 sm:h-14 sm:w-14" aria-hidden="true">
                <circle cx="32" cy="32" r="13" className="fill-citrus-400" />
                <path d="M32 5v8m0 38v8M5 32h8m38 0h8M13 13l6 6m26 26 6 6m0-38-6 6M19 45l-6 6" className="stroke-citrus-500" strokeWidth="3" strokeLinecap="round" />
                <path d="M17 51a21 21 0 0 0 30 0" fill="none" className="stroke-leaf-700" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <div className="mx-4 rounded-2xl border border-terracotta-100/90 bg-white/90 px-4 py-3 shadow-sm sm:mx-5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta-50 text-terracotta-700" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3 10 18H2L12 3Z" />
                    <path d="M12 9v5m0 3h.01" />
                  </svg>
                </span>
                <p className="text-sm font-bold text-soil-900 sm:text-base">{t('weather.heat.expected')}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs font-bold text-leaf-900 sm:px-5">
              <span>{t('guide.heat.water')}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-citrus-300 text-soil-900" aria-hidden="true">↗</span>
            </div>
          </aside>
        </div>
        <div className="px-5 py-7 sm:px-9 sm:py-9 lg:col-start-2 lg:px-12 lg:py-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-leaf-900 sm:text-4xl">
                {t('home.title')}
              </h1>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              {user ? (
                <ButtonLink to="/dashboard">
                  {t('home.dashboard')}
                  <span aria-hidden="true">→</span>
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink to="/register">{t('home.create')}</ButtonLink>
                  <Link to="/login" className="px-2 py-3 text-sm font-semibold text-leaf-800 underline decoration-leaf-300 underline-offset-4 hover:decoration-leaf-700">
                    {t('home.login')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="highlights-heading">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 id="highlights-heading" className="text-2xl font-bold leading-tight tracking-tight text-soil-900 sm:text-3xl">
              {t('home.highlightTitle')}
            </h2>
          </div>
          <span className="hidden h-px flex-1 bg-soil-200 sm:mb-3 sm:ml-8 sm:block" aria-hidden="true" />
        </div>
        <ol className="grid gap-4 lg:grid-cols-3">
          {highlights.map((item, index) => (
            <li
              key={item.number}
              className="group overflow-hidden rounded-[1.75rem] border border-soil-100 bg-white shadow-[0_12px_34px_rgba(36,37,31,0.055)] transition duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`relative h-40 overflow-hidden ${index === 0 ? 'bg-leaf-100' : index === 1 ? 'bg-terracotta-50' : 'bg-wheat-100'}`}>
                <FeatureArtwork index={index} />
                <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-extrabold tracking-wider ${index === 1 ? 'bg-white/80 text-terracotta-700' : 'bg-white/80 text-leaf-800'}`}>
                  {item.number}
                </span>
              </div>
              <div className="px-5 pb-6 pt-5 sm:px-6">
                <h3 className="text-lg font-bold leading-snug text-soil-900">{item.title}</h3>
              </div>
            </li>
          ))}
        </ol>
      </section>

    </div>
  );
}
