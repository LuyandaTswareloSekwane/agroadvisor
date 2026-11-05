import { useLanguage } from '../../hooks/useLanguage';
import type { WeatherHazard } from '../../utils/weatherAdvice';

interface WeatherGuideIllustrationProps {
  hazard: WeatherHazard;
  compact?: boolean;
}

function Scene({ hazard }: WeatherGuideIllustrationProps) {
  if (hazard === 'heat') {
    return (
      <>
        <circle cx="260" cy="34" r="18" fill="#e9a83b" />
        <path d="M42 87h128M58 87l35-36 35 36" fill="#d8c59c" stroke="#76583b" strokeWidth="5" />
        <rect x="70" y="87" width="85" height="43" rx="4" fill="#bfdaaf" />
        <ellipse cx="111" cy="109" rx="21" ry="12" fill="#fff" stroke="#573f30" strokeWidth="3" />
        <ellipse cx="137" cy="103" rx="9" ry="8" fill="#fff" stroke="#573f30" strokeWidth="3" />
        <path d="m132 96-3-5m10 5 4-5m-33 29v10m15-10v10m10-14 1 12m-36-15-7-4" fill="none" stroke="#573f30" strokeWidth="3" strokeLinecap="round" />
        <circle cx="105" cy="106" r="4" fill="#573f30" />
        <circle cx="139" cy="102" r="1.5" fill="#2b1f18" />
        <path d="M140 108q4 3 7 0" fill="none" stroke="#573f30" strokeWidth="2" />
        <path d="M203 86h73M213 86l29-24 29 24" fill="#deecd6" stroke="#41772f" strokeWidth="5" />
        <path d="M221 125v-35m20 35V90m20 35V90" stroke="#41772f" strokeWidth="4" />
        <path d="M221 103h40" stroke="#56923c" strokeWidth="3" />
        <path d="M183 91v26h19V91z" fill="#7db3da" stroke="#315f7e" strokeWidth="4" />
        <path d="M188 90V78h9v12" fill="none" stroke="#315f7e" strokeWidth="4" />
        <path d="M78 71h67" stroke="#2f6b3a" strokeWidth="4" strokeDasharray="5 6" />
      </>
    );
  }
  if (hazard === 'cold') {
    return (
      <>
        <path d="M58 90h94M70 90l40-39 40 39" fill="#ece3da" stroke="#6d513c" strokeWidth="5" />
        <rect x="78" y="90" width="55" height="40" rx="3" fill="#d9c6b3" />
        <path d="M216 126V86m-16 21 32-20m-32 0 32 20" stroke="#5a9bb0" strokeWidth="4" />
        <path d="M216 76v61m-25-45 50 29m0-29-50 29" stroke="#5a9bb0" strokeWidth="3" />
        <path d="M204 128h24m-19-8h15" stroke="#41772f" strokeWidth="4" />
        <path d="M47 47l9 9m0-9-9 9m207 35 10 10m0-10-10 10" stroke="#78b5cc" strokeWidth="4" />
      </>
    );
  }
  if (hazard === 'rain') {
    return (
      <>
        <path d="M66 75c-2-17 12-30 29-30 9-19 41-15 45 7 18 0 26 22 13 34H79c-7 0-13-4-13-11z" fill="#bfdaaf" stroke="#41772f" strokeWidth="4" />
        <path d="m93 99-9 22m37-22-9 22m37-22-9 22" stroke="#4c9ac0" strokeWidth="6" strokeLinecap="round" />
        <path d="M42 136c27-12 44 12 69 0s42 12 68 0 42 12 71 0" fill="none" stroke="#4c9ac0" strokeWidth="7" />
        <path d="M218 80h50M227 80l21-25 21 25" fill="#e0c27a" stroke="#6d513c" strokeWidth="4" />
        <rect x="230" y="80" width="33" height="36" fill="#f3e7c9" stroke="#6d513c" strokeWidth="4" />
      </>
    );
  }
  if (hazard === 'wind') {
    return (
      <>
        <path d="M33 53h120c21 0 21 25 0 25h-19m-97 17h169c23 0 23 27 0 27h-22m-151-53h62" fill="none" stroke="#78b5cc" strokeWidth="7" strokeLinecap="round" />
        <path d="M216 120V77m36 43V77m-45 0 27-24 27 24z" fill="#bfdaaf" stroke="#41772f" strokeWidth="5" />
        <path d="M219 93h30M219 105h30" stroke="#56923c" strokeWidth="3" />
        <path d="M225 120v12m19-12v12" stroke="#76583b" strokeWidth="4" />
      </>
    );
  }
  return (
    <>
      <path d="M55 81h117M67 81l46-39 46 39" fill="#ece3da" stroke="#6d513c" strokeWidth="5" />
      <rect x="78" y="81" width="70" height="53" rx="3" fill="#f7f0dc" stroke="#6d513c" strokeWidth="4" />
      <rect x="104" y="99" width="20" height="35" fill="#bfdaaf" stroke="#6d513c" strokeWidth="3" />
      <path d="m227 37-24 46h22l-11 39 40-55h-24l13-30z" fill="#e9a83b" stroke="#9c5b1c" strokeWidth="3" />
      <path d="M198 129h81" stroke="#76583b" strokeWidth="5" />
    </>
  );
}

function GuideIcon({ kind }: { kind: 'shade' | 'water' | 'crop' | 'shelter' | 'safe' }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (kind === 'water') {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6"><path {...common} d="M12 3C9 7 6 10 6 14a6 6 0 0 0 12 0c0-4-3-7-6-11Z" /><path {...common} d="M9 15c.3 1.4 1.2 2.2 2.6 2.5" /></svg>;
  }
  if (kind === 'crop') {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6"><path {...common} d="M12 21V8m0 6c-4 0-6-2-6-5 4 0 6 2 6 5Zm0-3c0-4 2-6 6-6 0 4-2 6-6 6Zm-7 8h14" /></svg>;
  }
  if (kind === 'shade') {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6"><path {...common} d="M3 11 12 4l9 7M5 10v10h14V10M9 20v-6h6v6M4 4l2-2m12 2 2-2" /></svg>;
  }
  if (kind === 'shelter') {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6"><path {...common} d="m3 11 9-7 9 7M5 10v10h14V10M9 20v-6h6v6" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6"><path {...common} d="M12 3 4 6v5c0 5 3 8 8 10 5-2 8-5 8-10V6l-8-3Z" /><path {...common} d="m8.5 12 2.3 2.3 4.8-5" /></svg>;
}

const guideByHazard = {
  heat: [
    { title: 'guide.heat.shade', text: 'guide.heat.shadeText', icon: 'shade' },
    { title: 'guide.heat.water', text: 'guide.heat.waterText', icon: 'water' },
    { title: 'guide.heat.crops', text: 'guide.heat.cropsText', icon: 'crop' },
  ],
  cold: [
    { title: 'guide.cold.shelter', text: 'guide.cold.shelterText', icon: 'shelter' },
    { title: 'guide.cold.crops', text: 'guide.cold.cropsText', icon: 'crop' },
  ],
  rain: [
    { title: 'guide.rain.drain', text: 'guide.rain.drainText', icon: 'safe' },
    { title: 'guide.rain.clear', text: 'guide.rain.clearText', icon: 'water' },
  ],
  wind: [
    { title: 'guide.wind.secure', text: 'guide.wind.secureText', icon: 'safe' },
    { title: 'guide.wind.shelter', text: 'guide.wind.shelterText', icon: 'shelter' },
  ],
  storm: [
    { title: 'guide.storm.shelter', text: 'guide.storm.shelterText', icon: 'shelter' },
    { title: 'guide.storm.lightning', text: 'guide.storm.lightningText', icon: 'safe' },
  ],
} as const;

export function WeatherGuideIllustration({ hazard, compact = false }: WeatherGuideIllustrationProps) {
  const { t } = useLanguage();
  const illustration = (
    <svg
      viewBox="0 0 320 160"
      role="img"
      aria-label={t(`weather.${hazard}.title`)}
      className={compact ? 'h-20 w-full rounded-lg bg-red-100' : 'mb-3 h-36 w-full rounded-lg bg-white sm:h-44'}
    >
      <rect x="0" y="0" width="320" height="160" rx="12" fill={compact ? '#fff1f2' : '#fcf9f1'} />
      <path d="M20 137h280" stroke="#bfdaaf" strokeWidth="4" />
      <Scene hazard={hazard} />
    </svg>
  );

  if (compact) return illustration;

  return (
    <section className="mt-4 rounded-xl border border-soil-200 bg-wheat-50 p-3 sm:p-4" aria-label={t('weather.actionGuide')}>
      <h4 className="mb-3 text-base font-bold text-soil-900">{t('weather.actionGuide')}</h4>
      {illustration}
      <ul className="grid gap-3 sm:grid-cols-2">
        {guideByHazard[hazard].map((step) => (
          <li key={step.title} className="flex gap-3 rounded-lg bg-white p-3">
            <span className="mt-0.5 shrink-0 text-leaf-700">
              <GuideIcon kind={step.icon} />
            </span>
            <div>
              <h5 className="text-sm font-bold text-soil-900">{t(step.title)}</h5>
              <p className="mt-1 text-sm leading-6 text-soil-700">{t(step.text)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
