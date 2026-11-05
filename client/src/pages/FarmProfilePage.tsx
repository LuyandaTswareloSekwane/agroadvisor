import { useNavigate } from 'react-router';
import { FarmProfileForm } from '../components/farm/FarmProfileForm';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageLoader } from '../components/ui/PageLoader';
import { useAsyncData } from '../hooks/useAsyncData';
import { useAuth } from '../hooks/useAuth';
import { getFarm, getFarmLoadErrorMessage, getFarmSaveErrorMessage, saveFarm } from '../services/farmService';
import type { FarmFormValues } from '../types/farm';
import { toFarmFormValues, toFarmInput } from '../utils/farmForm';
import { useLanguage } from '../hooks/useLanguage';

export function FarmProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: farm, error, isLoading, reload } = useAsyncData(user?.uid ?? null, getFarm);
  const isNew = farm === null;

  async function handleSubmit(values: FarmFormValues) {
    if (!user) return;
    await saveFarm(user.uid, toFarmInput(values), isNew);
    navigate('/dashboard');
  }

  if (isLoading) {
    return <PageLoader label={t('farm.profile')} />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert tone="error">{getFarmLoadErrorMessage(error)}</Alert>
        <Button variant="secondary" onClick={reload}>
          {t('weather.tryAgain')}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-leaf-900 via-leaf-800 to-emerald-500 shadow-xl shadow-leaf-900/15">
        <img
          src={farm?.photoDataUrl || '/farm-hero.jpg'}
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-r from-leaf-900/95 via-leaf-900/85 to-leaf-800/45"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -right-10 -top-20 -z-10 h-64 w-64 rounded-full bg-citrus-300/25 blur-3xl" aria-hidden="true" />
        <div className="relative flex min-h-48 items-center px-5 py-7 text-white sm:min-h-56 sm:px-8 sm:py-9">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide text-white/95 backdrop-blur-sm">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-citrus-300" fill="none" aria-hidden="true">
                <path d="M20 4c-8 0-13 3.2-13 9a5 5 0 0 0 5 5c5.8 0 8-6 8-14Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M4 21c2-5 5-8 10-11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              {t('nav.farm')}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {isNew ? t('farm.setup') : t('farm.profile')}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/85 sm:text-base">
              {t('farm.profileIntro')}
            </p>
          </div>
        </div>
      </header>
      <Card className="overflow-hidden border-leaf-100 bg-gradient-to-br from-white via-white to-leaf-50/60 p-4 shadow-xl shadow-leaf-900/5 sm:p-7">
        <FarmProfileForm
          initialValues={toFarmFormValues(farm)}
          isNew={isNew}
          onSubmit={handleSubmit}
          getErrorMessage={getFarmSaveErrorMessage}
        />
      </Card>
    </div>
  );
}
