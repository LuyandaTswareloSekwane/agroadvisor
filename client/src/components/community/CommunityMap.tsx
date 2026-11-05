import { CircleMarker, MapContainer, Popup, useMapEvents } from 'react-leaflet';
import { OpenStreetMapLayer } from '../map/OpenStreetMapLayer';
import type { FarmLocation } from '../../types/farm';
import type { CommunityObservation } from '../../types/communityObservation';
import { useLanguage } from '../../hooks/useLanguage';

interface CommunityMapProps {
  farmLocation: FarmLocation;
  farmName: string;
  observations: CommunityObservation[];
  selectedLocation: FarmLocation | null;
  onSelectLocation: (location: FarmLocation) => void;
}

function MapClickSelector({ onSelectLocation }: Pick<CommunityMapProps, 'onSelectLocation'>) {
  useMapEvents({
    click: (event) => onSelectLocation({
      latitude: event.latlng.lat,
      longitude: event.latlng.lng,
    }),
  });
  return null;
}

function observationColor(type: CommunityObservation['type']): string {
  if (type === 'flooding') return '#2563eb';
  if (type === 'frost') return '#7c3aed';
  return '#ca8a04';
}

export function CommunityMap({
  farmLocation,
  farmName,
  observations,
  selectedLocation,
  onSelectLocation,
}: CommunityMapProps) {
  const { t } = useLanguage();

  return (
    <div className="overflow-hidden rounded-2xl border border-leaf-200 bg-white shadow-sm">
      <MapContainer
        center={[farmLocation.latitude, farmLocation.longitude]}
        zoom={11}
        className="h-72 w-full sm:h-[30rem]"
        aria-label={t('community.mapLabel')}
      >
        <OpenStreetMapLayer />
        <MapClickSelector onSelectLocation={onSelectLocation} />
        <CircleMarker
          center={[farmLocation.latitude, farmLocation.longitude]}
          radius={11}
          pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#166534', fillOpacity: 1 }}
        >
          <Popup>
            <strong>{farmName}</strong>
            <br />
            {t('community.farmMarker')}
          </Popup>
        </CircleMarker>
        {observations.map((observation) => (
          <CircleMarker
            key={observation.id}
            center={[observation.location.latitude, observation.location.longitude]}
            radius={8}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              fillColor: observationColor(observation.type),
              fillOpacity: 0.9,
            }}
            eventHandlers={{
              click: (event) => event.originalEvent.stopPropagation(),
            }}
          >
            <Popup>
              <strong>{t(`community.type.${observation.type}`)}</strong>
              {observation.details && <p className="mt-1 max-w-56 whitespace-pre-wrap">{observation.details}</p>}
              <p className="mt-1 text-xs">{t('community.farmerReported')}</p>
            </Popup>
          </CircleMarker>
        ))}
        {selectedLocation && (
          <CircleMarker
            center={[selectedLocation.latitude, selectedLocation.longitude]}
            radius={10}
            pathOptions={{ color: '#78350f', weight: 2, fillColor: '#fbbf24', fillOpacity: 0.95 }}
          >
            <Popup>{t('community.selectedPin')}</Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
