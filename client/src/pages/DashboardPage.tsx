import { WeatherAdvisory } from '../components/farm/WeatherAdvisory';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { ButtonLink } from '../components/ui/ButtonLink';
import { Card } from '../components/ui/Card';
import { PageLoader } from '../components/ui/PageLoader';
import { useAsyncData } from '../hooks/useAsyncData';
import { useAuth } from '../hooks/useAuth';
import { getFarm, getFarmLoadErrorMessage } from '../services/farmService';
import { getFarmerProfile, getFarmerProfileErrorMessage } from '../services/farmerService';
import { useLanguage } from '../hooks/useLanguage';

export function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const uid = user?.uid ?? null;
  const profile = useAsyncData(uid, getFarmerProfile);
  const farm = useAsyncData(uid, getFarm);

  const firstName = (profile.data?.fullName ?? user?.displayName)?.split(' ')[0];

  return (
    <div className="space-y-5 sm:space-y-6">
      {profile.error !== null && <Alert tone="error">{getFarmerProfileErrorMessage(profile.error)}</Alert>}

      {farm.isLoading ? (
        <PageLoader label={t('dashboard.loading')} />
      ) : farm.error !== null ? (
        <div className="space-y-3">
          <Alert tone="error">{getFarmLoadErrorMessage(farm.error)}</Alert>
          <Button variant="secondary" onClick={farm.reload}>
            Try again
          </Button>
        </div>
      ) : farm.data ? (
        uid && <WeatherAdvisory ownerId={uid} farm={farm.data} firstName={firstName} />
      ) : (
        <Card className="text-center sm:p-8">
          <h2 className="text-lg font-semibold text-leaf-800">{t('dashboard.setupTitle')}</h2>
          <div className="mt-4">
            <ButtonLink to="/farm">{t('dashboard.setupButton')}</ButtonLink>
          </div>
        </Card>
      )}
    </div>
  );
}
