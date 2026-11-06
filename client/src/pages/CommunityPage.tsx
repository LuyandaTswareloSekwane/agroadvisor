import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CommunityMap } from '../components/community/CommunityMap';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { ButtonLink } from '../components/ui/ButtonLink';
import { Card } from '../components/ui/Card';
import { PageLoader } from '../components/ui/PageLoader';
import { useAsyncData } from '../hooks/useAsyncData';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { LANGUAGE_LOCALES, type AppLanguage } from '../i18n';
import { formatLocalizedDate } from '../utils/weatherAdvice';
import {
  addCommunityObservation,
  CommunityObservationValidationError,
  deleteCommunityObservation,
  getCommunityMapData,
  getCommunityObservationErrorMessage,
  reportCommunityObservation,
} from '../services/communityObservationService';
import { distanceMeters } from '../utils/plotMeasurement';
import type { FarmLocation } from '../types/farm';
import type { CommunityObservation, CommunityObservationType } from '../types/communityObservation';

const OBSERVATION_TYPES: readonly CommunityObservationType[] = ['flooding', 'frost', 'other'];
const MAX_DISTANCE_FROM_FARM_METERS = 25_000;

function isObservationType(value: string): value is CommunityObservationType {
  return OBSERVATION_TYPES.some((type) => type === value);
}

function ObservationIcon({ type }: { type: CommunityObservationType }) {
  if (type === 'flooding') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      </svg>
    );
  }
  if (type === 'frost') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2v20M4 6l16 12M20 6 4 18M8 3l4 3 4-3M8 21l4-3 4 3M3 10l4-1-1-4M21 14l-4 1 1 4M21 10l-4-1 1-4M3 14l4 1-1 4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5m0-8h.01" />
    </svg>
  );
}

function observationColor(type: CommunityObservationType): string {
  if (type === 'flooding') return 'bg-blue-600';
  if (type === 'frost') return 'bg-violet-600';
  return 'bg-amber-500';
}

function formatObservationDate(observation: CommunityObservation, language: AppLanguage): string {
  return formatLocalizedDate(observation.createdAt.toDate(), language);
}

export function CommunityPage() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const ownerId = user?.uid ?? null;
  const mapData = useAsyncData(ownerId, getCommunityMapData);
  const [selectedLocation, setSelectedLocation] = useState<FarmLocation | null>(null);
  const [observationType, setObservationType] = useState<CommunityObservationType>('flooding');
  const [details, setDetails] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<string>>(() => new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const locale = LANGUAGE_LOCALES[language];

  useEffect(() => {
    setSelectedLocation(null);
    setReportedIds(new Set());
    setHiddenIds(new Set());
    setActionError(null);
    setActionNotice(null);
    setSelectionError(null);
  }, [ownerId]);

  const visibleObservations = useMemo(
    () => (mapData.data?.observations ?? []).filter((observation) => !hiddenIds.has(observation.id)),
    [hiddenIds, mapData.data?.observations],
  );

  function selectLocation(location: FarmLocation) {
    const farm = mapData.data?.farm;
    if (!farm || distanceMeters(farm.location, location) > MAX_DISTANCE_FROM_FARM_METERS) {
      setSelectedLocation(null);
      setSelectionError(t('community.outsideArea'));
      return;
    }
    setSelectedLocation(location);
    setSelectionError(null);
    setActionError(null);
    setActionNotice(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const farm = mapData.data?.farm;
    if (!ownerId || !farm) return;
    if (!selectedLocation) {
      setSelectionError(t('community.choosePin'));
      return;
    }

    setIsSaving(true);
    setActionError(null);
    setActionNotice(null);
    try {
      await addCommunityObservation(ownerId, selectedLocation, observationType, details, farm.location);
      setSelectedLocation(null);
      setDetails('');
      setActionNotice(t('community.saved'));
      mapData.reload();
    } catch (error: unknown) {
      setActionError(error instanceof CommunityObservationValidationError
        ? t('community.invalid')
        : getCommunityObservationErrorMessage(error, 'share this local observation'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReport(observation: CommunityObservation) {
    if (!ownerId || !window.confirm(t('community.confirmReport'))) return;
    setReportingId(observation.id);
    setActionError(null);
    setActionNotice(null);
    try {
      const result = await reportCommunityObservation(ownerId, observation.id);
      setReportedIds((current) => new Set(current).add(observation.id));
      setActionNotice(result === 'hidden'
        ? t('community.hidden')
        : result === 'already-reported'
          ? t('community.alreadyReported')
          : t('community.reported'));
      if (result === 'hidden') {
        setHiddenIds((current) => new Set(current).add(observation.id));
        mapData.reload();
      }
    } catch (error: unknown) {
      setActionError(getCommunityObservationErrorMessage(error, 'report this observation'));
    } finally {
      setReportingId(null);
    }
  }

  async function handleDelete(observation: CommunityObservation) {
    if (!ownerId || !window.confirm(t('community.confirmDelete'))) return;
    setDeletingId(observation.id);
    setActionError(null);
    setActionNotice(null);
    try {
      await deleteCommunityObservation(observation.id);
      setHiddenIds((current) => new Set(current).add(observation.id));
      setActionNotice(t('community.deleted'));
      mapData.reload();
    } catch (error: unknown) {
      setActionError(getCommunityObservationErrorMessage(error, 'remove your observation'));
    } finally {
      setDeletingId(null);
    }
  }

  if (mapData.isLoading) return <PageLoader label={t('community.title')} />;

  if (mapData.error !== null || !mapData.data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert tone="error">
          {mapData.error !== null
            ? getCommunityObservationErrorMessage(mapData.error, 'load nearby community observations')
            : t('community.loadError')}
        </Alert>
        <Button variant="secondary" onClick={mapData.reload}>{t('weather.tryAgain')}</Button>
      </div>
    );
  }

  if (!mapData.data.farm) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Card className="border-leaf-100 bg-gradient-to-br from-white via-leaf-50/60 to-wheat-50/80 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf-100 text-leaf-800">
            <ObservationIcon type="other" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-leaf-900">{t('community.title')}</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-soil-600">{t('community.setupText')}</p>
          <div className="mt-5">
            <ButtonLink to="/farm">{t('dashboard.setupButton')}</ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  const { farm } = mapData.data;
  const displayedObservations = visibleObservations;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-leaf-900 via-leaf-800 to-emerald-500 px-5 py-7 text-white shadow-xl shadow-leaf-900/15 sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-10 -top-20 -z-10 h-64 w-64 rounded-full bg-citrus-300/25 blur-3xl" aria-hidden="true" />
        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/95 backdrop-blur-sm">
          <ObservationIcon type="other" />
          {t('community.path')}
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{t('community.title')}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">{t('community.intro')}</p>
        <div className="mt-4 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white/95">
          <span>{farm.name}</span>
          <span aria-hidden="true">·</span>
          <span>{t('farm.near', {
            place: farm.locationName,
            size: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(farm.sizeHectares),
          })}</span>
        </div>
      </header>

      <Alert tone="info">
        <p>{t('community.privacy')}</p>
        <p className="mt-1">{t('community.moderation')}</p>
      </Alert>

      {actionError && <Alert tone="error">{actionError}</Alert>}
      {actionNotice && <Alert>{actionNotice}</Alert>}
      {selectionError && <Alert tone="warning">{selectionError}</Alert>}

      <section aria-labelledby="community-map-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="community-map-heading" className="text-xl font-extrabold tracking-tight text-leaf-900">{t('community.mapTitle')}</h2>
            <p className="mt-1 text-sm text-soil-600">{t('community.mapHint')}</p>
          </div>
          <span className="rounded-full border border-leaf-100 bg-white px-3 py-1.5 text-xs font-bold text-leaf-800">
            {t('community.noteCount', { count: displayedObservations.length })}
          </span>
        </div>
        <CommunityMap
          farmLocation={farm.location}
          farmName={farm.name}
          observations={displayedObservations}
          selectedLocation={selectedLocation}
          onSelectLocation={selectLocation}
        />
        <div role="group" className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-soil-700" aria-label={t('community.legend')}>
          <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-leaf-700" aria-hidden="true" />{t('community.farmMarker')}</span>
          {OBSERVATION_TYPES.map((type) => (
            <span key={type} className="inline-flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${observationColor(type)}`} aria-hidden="true" />
              {t(`community.type.${type}`)}
            </span>
          ))}
        </div>
        {mapData.data.hasMoreNearby && (
          <Alert tone="warning">{t('community.limitWarning')}</Alert>
        )}
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card className="border-leaf-100 bg-gradient-to-br from-white via-leaf-50/50 to-wheat-50/70">
          <h2 className="text-lg font-extrabold text-leaf-900">{t('community.addTitle')}</h2>
          <p className="mt-1 text-sm leading-5 text-soil-600">{t('community.addIntro')}</p>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="community-type" className="block text-sm font-semibold text-soil-800">{t('community.typeLabel')}</label>
              <select
                id="community-type"
                value={observationType}
                onChange={(event) => {
                  if (isObservationType(event.target.value)) setObservationType(event.target.value);
                }}
                className="mt-1 min-h-11 w-full rounded-lg border border-soil-200 bg-white px-3 text-base text-soil-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500"
              >
                {OBSERVATION_TYPES.map((type) => (
                  <option key={type} value={type}>{t(`community.type.${type}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="community-details" className="block text-sm font-semibold text-soil-800">{t('community.detailsLabel')}</label>
              <textarea
                id="community-details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                maxLength={240}
                rows={3}
                required={observationType === 'other'}
                className="mt-1 w-full resize-y rounded-lg border border-soil-200 bg-white px-3 py-2 text-base text-soil-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500"
              />
              <p className="mt-1 text-xs text-soil-500">{t('community.detailsHint')}</p>
            </div>
            <p className="rounded-xl border border-leaf-100 bg-white/80 px-3 py-2 text-sm font-medium text-leaf-900" role="status">
              {selectedLocation
                ? t('community.selectedCoordinates', {
                    latitude: selectedLocation.latitude.toFixed(4),
                    longitude: selectedLocation.longitude.toFixed(4),
                    distance: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
                      distanceMeters(farm.location, selectedLocation) / 1000,
                    ),
                  })
                : t('community.noPin')}
            </p>
            <Button type="submit" fullWidth isLoading={isSaving} disabled={!selectedLocation}>
              {t('community.share')}
            </Button>
          </form>
        </Card>

        <section aria-labelledby="community-nearby-heading">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h2 id="community-nearby-heading" className="text-xl font-extrabold tracking-tight text-leaf-900">{t('community.nearbyTitle')}</h2>
            <span className="text-xs font-medium text-soil-500">{t('community.farmerReported')}</span>
          </div>
          {displayedObservations.length === 0 ? (
            <Card className="border-dashed border-leaf-200 bg-white/80">
              <p className="text-sm leading-6 text-soil-600">{t('community.empty')}</p>
            </Card>
          ) : (
            <ol className="space-y-3">
              {displayedObservations.map((observation) => {
                const isOwnObservation = observation.authorId === ownerId;
                const alreadyReported = reportedIds.has(observation.id);
                return (
                  <li key={observation.id}>
                    <Card className="border-leaf-100 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${observationColor(observation.type)}`}>
                          <ObservationIcon type={observation.type} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                            <span className="text-xs font-bold text-leaf-800">{t(`community.type.${observation.type}`)}</span>
                            <time className="text-xs text-soil-500" dateTime={observation.createdAt.toDate().toISOString()}>
                              {formatObservationDate(observation, language)}
                            </time>
                          </div>
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-soil-500">{t('community.farmerReported')}</p>
                          {observation.details && <p className="mt-2 break-words text-sm leading-5 text-soil-700">{observation.details}</p>}
                          <p className="mt-2 text-xs text-soil-500">
                            {observation.location.latitude.toFixed(4)}, {observation.location.longitude.toFixed(4)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-soil-100 pt-3">
                        {isOwnObservation ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            isLoading={deletingId === observation.id}
                            disabled={deletingId !== null && deletingId !== observation.id}
                            onClick={() => void handleDelete(observation)}
                          >
                            {t('community.remove')}
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            isLoading={reportingId === observation.id}
                            disabled={alreadyReported || reportingId !== null || deletingId !== null}
                            onClick={() => void handleReport(observation)}
                          >
                            {alreadyReported
                              ? t('community.reportedButton')
                              : reportingId === observation.id ? t('community.reporting') : t('community.report')}
                          </Button>
                        )}
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
