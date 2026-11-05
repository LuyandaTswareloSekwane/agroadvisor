import { useEffect, useRef, useState } from 'react';
import type { FarmLocation } from '../../types/farm';
import { distanceMeters, measurePlot, type PlotMeasurement } from '../../utils/plotMeasurement';
import { useLanguage } from '../../hooks/useLanguage';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';

interface PlotSurveyProps {
  onMeasure: (measurement: PlotMeasurement) => void;
}

const MAX_ACCEPTED_ACCURACY_METERS = 35;
const MIN_POINT_DISTANCE_METERS = 4;

export function PlotSurvey({ onMeasure }: PlotSurveyProps) {
  const { language, t } = useLanguage();
  const [isTracking, setIsTracking] = useState(false);
  const [points, setPoints] = useState<FarmLocation[]>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [measurement, setMeasurement] = useState<PlotMeasurement | null>(null);
  const watchId = useRef<number | null>(null);
  const latestPoints = useRef<FarmLocation[]>([]);

  function stopWatching() {
    if (watchId.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
  }

  useEffect(() => () => {
    if (watchId.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchId.current);
    }
  }, []);

  function startSurvey() {
    setError(null);
    setMeasurement(null);
    setPoints([]);
    setAccuracy(null);
    latestPoints.current = [];

    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setError(t('farm.plotSecureContext'));
      return;
    }
    if (!('geolocation' in navigator)) {
      setError(t('farm.plotUnavailable'));
      return;
    }

    setIsTracking(true);
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setAccuracy(coords.accuracy);
        if (
          !Number.isFinite(coords.accuracy)
          || coords.accuracy > MAX_ACCEPTED_ACCURACY_METERS
          || !Number.isFinite(coords.latitude)
          || !Number.isFinite(coords.longitude)
        ) return;

        const nextPoint = { latitude: coords.latitude, longitude: coords.longitude };
        const previousPoint = latestPoints.current.at(-1);
        if (previousPoint && distanceMeters(previousPoint, nextPoint) < MIN_POINT_DISTANCE_METERS) return;

        const nextPoints = [...latestPoints.current, nextPoint];
        latestPoints.current = nextPoints;
        setPoints(nextPoints);
      },
      (positionError) => {
        stopWatching();
        const message = positionError.code === positionError.PERMISSION_DENIED
          ? t('farm.plotPermissionDenied')
          : positionError.code === positionError.TIMEOUT
            ? t('farm.plotTimeout')
            : t('farm.plotLocationError');
        setError(message);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 },
    );
  }

  function finishSurvey() {
    try {
      const result = measurePlot(latestPoints.current);
      onMeasure(result);
      setMeasurement(result);
      setError(null);
      stopWatching();
    } catch {
      setError(t('farm.plotMeasureError'));
    }
  }

  const numberFormat = new Intl.NumberFormat(language, { maximumFractionDigits: 2 });

  return (
    <section className="space-y-3 rounded-xl border border-leaf-200 bg-leaf-50/80 p-4" aria-labelledby="plot-survey-title">
      <div>
        <h3 id="plot-survey-title" className="text-sm font-bold text-leaf-900">{t('farm.plotSurveyTitle')}</h3>
        <p className="mt-1 text-sm leading-5 text-soil-700">{t('farm.plotSurveyIntro')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {!isTracking ? (
          <Button type="button" variant="secondary" onClick={startSurvey}>
            {measurement ? t('farm.plotSurveyAgain') : t('farm.plotSurveyStart')}
          </Button>
        ) : (
          <Button type="button" onClick={finishSurvey} disabled={points.length < 3}>
            {t('farm.plotSurveyFinish')}
          </Button>
        )}
        {isTracking && (
          <Button type="button" variant="secondary" onClick={stopWatching}>
            {t('farm.plotSurveyCancel')}
          </Button>
        )}
      </div>

      {isTracking && (
        <p role="status" aria-live="polite" className="text-sm font-medium text-leaf-900">
          {t('farm.plotSurveyProgress', { count: points.length })}
          {accuracy !== null && ` · ${t('farm.plotGpsAccuracy', { accuracy: numberFormat.format(accuracy) })}`}
          {accuracy !== null && accuracy > MAX_ACCEPTED_ACCURACY_METERS && ` · ${t('farm.plotGpsWeak')}`}
        </p>
      )}

      {measurement && (
        <Alert tone="info" title={t('farm.plotSurveyResult')}>
          <p>
            {t('farm.plotSurveyArea', {
              hectares: numberFormat.format(measurement.areaHectares),
              acres: numberFormat.format(measurement.areaAcres),
            })}
          </p>
          <p className="mt-1">
            {t('farm.plotSurveyPerimeter', { meters: numberFormat.format(measurement.perimeterMeters) })}
          </p>
          <p className="mt-1">
            {t('farm.plotSurveySquareSide', { meters: numberFormat.format(measurement.squareSideMeters) })}
          </p>
          <p className="mt-2 text-xs">{t('farm.plotSurveyEstimateNote')}</p>
        </Alert>
      )}

      {error && <Alert tone="warning">{error}</Alert>}
      <p className="text-xs text-soil-600">{t('farm.plotSurveyPrivacy')}</p>
    </section>
  );
}
