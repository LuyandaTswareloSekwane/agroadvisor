import type { FarmLocation } from '../types/farm';

type Town = [name: string, latitude: number, longitude: number];

function isTown(value: unknown): value is Town {
  return Array.isArray(value) && value.length === 3 &&
    typeof value[0] === 'string' && value[0].length > 0 &&
    typeof value[1] === 'number' && Number.isFinite(value[1]) &&
    typeof value[2] === 'number' && Number.isFinite(value[2]);
}

/** Finds a nearby populated place locally, without sending farm coordinates to a geocoder. */
export function findNearbyTown(location: FarmLocation, towns: Town[]): string | null {
  const radians = Math.PI / 180;
  const lat = location.latitude * radians;
  let closest: string | null = null;
  let minimum = Infinity;
  for (const [name, townLatitude, townLongitude] of towns) {
    const latDifference = (townLatitude - location.latitude) * radians;
    const lonDifference = (townLongitude - location.longitude) * radians;
    const a = Math.sin(latDifference / 2) ** 2 +
      Math.cos(lat) * Math.cos(townLatitude * radians) * Math.sin(lonDifference / 2) ** 2;
    const distance = 2 * 6371 * Math.asin(Math.sqrt(Math.min(1, a)));
    if (distance < minimum) {
      minimum = distance;
      closest = name;
    }
  }
  return minimum <= 50 ? closest : null;
}

let townsRequest: Promise<Town[]> | null = null;

export async function lookupNearbyTown(location: FarmLocation): Promise<string | null> {
  if (!townsRequest) {
    townsRequest = fetch(`${import.meta.env.BASE_URL}geonames-towns.json`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Town data returned HTTP ${response.status}`);
        const data: unknown = await response.json();
        if (!Array.isArray(data) || data.length === 0 || !data.every(isTown)) {
          throw new Error('Town data has an invalid format');
        }
        return data;
      })
      .catch((error: unknown) => {
        townsRequest = null;
        throw error;
      });
  }
  return findNearbyTown(location, await townsRequest);
}
