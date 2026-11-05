import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Pane, useMap, useMapEvents } from 'react-leaflet';
import { WEATHER_RISK_THRESHOLDS } from '../../../../config/knowledge-base/weather-risks';
import { OpenStreetMapLayer } from '../map/OpenStreetMapLayer';
import { getRegionalTemperatureGrid } from '../../services/weatherService';
import type { FarmLocation } from '../../types/farm';
import type { RegionalTemperaturePoint } from '../../types/weather';
import { useLanguage } from '../../hooks/useLanguage';

/** Initial view when no farm location is set yet: the whole of South Africa. */
const DEFAULT_CENTER: [number, number] = [-29.0, 24.5];
const DEFAULT_ZOOM = 5;
/** Zoom level at which individual fields are distinguishable. */
const FARM_ZOOM = 13;

interface LocationPickerProps {
  value: FarmLocation | null;
  onChange: (location: FarmLocation) => void;
}

function ClickToSelect({ onChange }: Pick<LocationPickerProps, 'onChange'>) {
  useMapEvents({
    click: (event) => onChange({ latitude: event.latlng.lat, longitude: event.latlng.lng }),
  });
  return null;
}

/** Zooms in on a newly chosen point, or pans to it if it is outside the current view. */
function FollowLocation({ value }: Pick<LocationPickerProps, 'value'>) {
  const map = useMap();
  const latitude = value?.latitude;
  const longitude = value?.longitude;

  // Depend on the numbers, not the object, so unrelated re-renders never move the map.
  useEffect(() => {
    if (latitude === undefined || longitude === undefined) return;
    const point: [number, number] = [latitude, longitude];
    if (map.getZoom() < FARM_ZOOM - 1) {
      map.setView(point, FARM_ZOOM);
    } else if (!map.getBounds().contains(point)) {
      map.panTo(point);
    }
  }, [map, latitude, longitude]);

  return null;
}

type TemperatureBand = 'cool' | 'mild' | 'warm' | 'hot';

function temperatureBand(temperatureC: number): TemperatureBand {
  const [cool, mild, warm] = WEATHER_RISK_THRESHOLDS.mapTemperatureBandsC;
  if (temperatureC < cool) return 'cool';
  if (temperatureC < mild) return 'mild';
  if (temperatureC < warm) return 'warm';
  return 'hot';
}

const TEMPERATURE_BANDS: TemperatureBand[] = ['cool', 'mild', 'warm', 'hot'];
const TEMPERATURE_COLORS: Record<TemperatureBand, string> = {
  cool: '#3b82f6',
  mild: '#22a06b',
  warm: '#e7a52b',
  hot: '#dc4a35',
};

interface TemperatureHeatLayerProps {
  points: RegionalTemperaturePoint[];
  selectedBand: TemperatureBand | null;
  selectedPoint: RegionalTemperaturePoint | null;
  onSelectPoint: (point: RegionalTemperaturePoint) => void;
}

function TemperatureHeatLayer({ points, selectedBand, selectedPoint, onSelectPoint }: TemperatureHeatLayerProps) {
  return (
    <>
      <Pane name="temperature-heatmap" style={{ zIndex: 400, pointerEvents: 'auto' }}>
        {points.map((point, index) => {
          const pointBand = temperatureBand(point.temperatureC);
          const matchesFilter = selectedBand === null || pointBand === selectedBand;
          const isSelected = selectedPoint?.latitude === point.latitude
            && selectedPoint.longitude === point.longitude
            && selectedPoint.temperatureC === point.temperatureC;
          return (
            <CircleMarker
              key={`${point.latitude}-${point.longitude}-${index}`}
              center={[point.latitude, point.longitude]}
              radius={matchesFilter ? 30 : 23}
              pathOptions={{
                stroke: isSelected,
                color: '#ffffff',
                weight: isSelected ? 3 : 0,
                fillColor: TEMPERATURE_COLORS[pointBand],
                fillOpacity: matchesFilter ? 0.58 : 0.12,
              }}
              eventHandlers={{
                click: (event) => {
                  event.originalEvent.stopPropagation();
                  onSelectPoint(point);
                },
              }}
            />
          );
        })}
      </Pane>
    </>
  );
}

/** Map for choosing the farm's location by tapping on it (OpenStreetMap tiles). */
export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const { t } = useLanguage();
  const [points, setPoints] = useState<RegionalTemperaturePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBand, setSelectedBand] = useState<TemperatureBand | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<RegionalTemperaturePoint | null>(null);
  const center: [number, number] = value ? [value.latitude, value.longitude] : DEFAULT_CENTER;
  const latitude = value?.latitude;
  const longitude = value?.longitude;

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) {
      setPoints([]);
      setSelectedPoint(null);
      setSelectedBand(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isCurrent = true;
    setPoints([]);
    setSelectedPoint(null);
    setSelectedBand(null);
    setIsLoading(true);
    setError(null);
    const timer = window.setTimeout(() => {
      getRegionalTemperatureGrid({ latitude, longitude }).then(
        (temperatures) => {
          if (!isCurrent) return;
          setPoints(temperatures);
          setIsLoading(false);
        },
        (requestError: unknown) => {
          if (!isCurrent) return;
          setError(requestError instanceof Error ? requestError.message : t('map.error'));
          setPoints([]);
          setSelectedPoint(null);
          setIsLoading(false);
        },
      );
    }, 500);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [latitude, longitude, t]);

  const visiblePoints = useMemo(
    () => selectedBand
      ? points.filter((point) => temperatureBand(point.temperatureC) === selectedBand)
      : points,
    [points, selectedBand],
  );
  const temperatures = visiblePoints.map((point) => point.temperatureC);
  const temperatureRange = temperatures.length > 0
    ? `${Math.min(...temperatures).toFixed(0)}–${Math.max(...temperatures).toFixed(0)}`
    : null;
  const temperatureLabels: Record<TemperatureBand, string> = {
    cool: t('map.cool', { temperature: WEATHER_RISK_THRESHOLDS.mapTemperatureBandsC[0] }),
    mild: t('map.mild'),
    warm: t('map.warm'),
    hot: t('map.hot', { temperature: WEATHER_RISK_THRESHOLDS.mapTemperatureBandsC[2] }),
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-leaf-200 bg-white shadow-sm">
      <MapContainer
        center={center}
        zoom={value ? FARM_ZOOM : DEFAULT_ZOOM}
        className="h-72 w-full sm:h-96"
        aria-label={t('map.label')}
      >
        <OpenStreetMapLayer />
        <ClickToSelect onChange={onChange} />
        <FollowLocation value={value} />
        <TemperatureHeatLayer
          points={points}
          selectedBand={selectedBand}
          selectedPoint={selectedPoint}
          onSelectPoint={setSelectedPoint}
        />
        {value && (
          <CircleMarker
            center={[value.latitude, value.longitude]}
            radius={10}
            pathOptions={{ className: 'farm-marker', weight: 3, fillOpacity: 1 }}
          />
        )}
      </MapContainer>
      <div className="space-y-3 border-t border-leaf-100 bg-gradient-to-r from-white via-leaf-50/60 to-wheat-50/70 p-3 sm:p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-soil-700">{t('map.nearby')}</p>
        <div className="flex flex-wrap gap-2">
          {TEMPERATURE_BANDS.map((band) => (
            <button
              key={band}
              type="button"
              aria-pressed={selectedBand === band}
              aria-label={t('map.filterCategory', { category: temperatureLabels[band] })}
              onClick={() => {
                setSelectedBand((current) => current === band ? null : band);
                setSelectedPoint(null);
              }}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500 ${
                selectedBand === band
                  ? 'border-leaf-700 bg-leaf-50 text-leaf-900'
                  : 'border-soil-200 bg-white text-soil-700 hover:bg-soil-50'
              }`}
            >
              <span className="h-3.5 w-3.5 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: TEMPERATURE_COLORS[band] }} aria-hidden="true" />
              {temperatureLabels[band]}
            </button>
          ))}
          {selectedBand && (
            <button
              type="button"
              onClick={() => {
                setSelectedBand(null);
                setSelectedPoint(null);
              }}
              className="min-h-10 rounded-full px-3 text-xs font-semibold text-leaf-800 underline underline-offset-2"
            >
              {t('map.showAllBands')}
            </button>
          )}
        </div>
        <div className="space-y-1 text-xs text-soil-600" aria-live="polite">
          {isLoading && <p>{t('map.loading')}</p>}
          {temperatureRange && <p>{t('map.range', { range: temperatureRange })}</p>}
          {selectedBand && <p>{t('map.filteredPoints', { count: visiblePoints.length })}</p>}
          {selectedPoint && (
            <p className="font-semibold text-leaf-800">
              {t('map.selectedPoint', {
                latitude: selectedPoint.latitude.toFixed(3),
                longitude: selectedPoint.longitude.toFixed(3),
                temperature: selectedPoint.temperatureC.toFixed(1),
              })}
            </p>
          )}
          {error && <p className="text-red-700">{error}</p>}
          <p className="pt-1 text-soil-500">{t('map.explanation')}</p>
        </div>
      </div>
    </div>
  );
}
