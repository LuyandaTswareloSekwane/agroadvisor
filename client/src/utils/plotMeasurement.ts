import type { FarmLocation } from '../types/farm';

export interface PlotMeasurement {
  areaHectares: number;
  areaAcres: number;
  perimeterMeters: number;
  squareSideMeters: number;
}

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function distanceMeters(first: FarmLocation, second: FarmLocation): number {
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const latitudeDifference = secondLatitude - firstLatitude;
  const longitudeDifference = toRadians(second.longitude - first.longitude);
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDifference / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

/** Estimates the area of a small GPS polygon using a local projection. */
export function measurePlot(points: FarmLocation[]): PlotMeasurement {
  if (points.length < 3) {
    throw new Error('A plot needs at least three boundary points to estimate its area.');
  }
  if (points.some(({ latitude, longitude }) =>
    !Number.isFinite(latitude) || !Number.isFinite(longitude)
    || Math.abs(latitude) > 90 || Math.abs(longitude) > 180)) {
    throw new Error('The boundary contains an invalid GPS coordinate.');
  }

  const averageLatitude = points.reduce((sum, point) => sum + point.latitude, 0) / points.length;
  const averageLongitude = points.reduce((sum, point) => sum + point.longitude, 0) / points.length;
  const latitudeOrigin = toRadians(averageLatitude);
  const longitudeOrigin = toRadians(averageLongitude);
  const projectedPoints = points.map((point) => ({
    x: EARTH_RADIUS_METERS * (toRadians(point.longitude) - longitudeOrigin) * Math.cos(latitudeOrigin),
    y: EARTH_RADIUS_METERS * (toRadians(point.latitude) - latitudeOrigin),
  }));

  let twiceArea = 0;
  let perimeterMeters = 0;
  for (let index = 0; index < points.length; index += 1) {
    const nextIndex = (index + 1) % points.length;
    const current = projectedPoints[index];
    const next = projectedPoints[nextIndex];
    const currentPoint = points[index];
    const nextPoint = points[nextIndex];
    if (!current || !next || !currentPoint || !nextPoint) {
      throw new Error('The boundary points could not be measured.');
    }
    twiceArea += current.x * next.y - next.x * current.y;
    perimeterMeters += distanceMeters(currentPoint, nextPoint);
  }

  const areaSquareMeters = Math.abs(twiceArea) / 2;
  if (!Number.isFinite(areaSquareMeters) || areaSquareMeters <= 0 || !Number.isFinite(perimeterMeters)) {
    throw new Error('The boundary points did not form a measurable plot. Walk the boundary again.');
  }

  const areaHectares = areaSquareMeters / 10_000;
  return {
    areaHectares,
    areaAcres: areaHectares * 2.47105,
    perimeterMeters,
    squareSideMeters: Math.sqrt(areaSquareMeters),
  };
}
