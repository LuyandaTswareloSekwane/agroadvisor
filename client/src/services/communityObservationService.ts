import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import type { FarmLocation } from '../types/farm';
import type {
  CommunityMapData,
  CommunityObservation,
  CommunityObservationType,
  CommunityReportResult,
} from '../types/communityObservation';
import { distanceMeters } from '../utils/plotMeasurement';
import { getFirebaseDb } from './firebase';
import { getFarm } from './farmService';
import { getFirestoreErrorMessage } from './firestoreErrors';

const OBSERVATIONS_COLLECTION = 'communityObservations';
const REPORTS_COLLECTION = 'communityReports';
const REPORTS_SUBCOLLECTION = 'reports';
const NEARBY_RADIUS_METERS = 25_000;
const MAX_NEARBY_OBSERVATIONS = 200;
const VALID_TYPES: readonly CommunityObservationType[] = ['flooding', 'frost', 'other'];

export class CommunityObservationValidationError extends Error {
  constructor() {
    super('The community observation is invalid.');
    this.name = 'CommunityObservationValidationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObservationType(value: unknown): value is CommunityObservationType {
  return typeof value === 'string' && VALID_TYPES.some((type) => type === value);
}

function parseObservation(id: string, value: unknown): CommunityObservation {
  if (
    !isRecord(value)
    || !isObservationType(value.type)
    || typeof value.details !== 'string'
    || value.details.length > 240
    || !isRecord(value.location)
    || typeof value.location.latitude !== 'number'
    || !Number.isFinite(value.location.latitude)
    || value.location.latitude < -90
    || value.location.latitude > 90
    || typeof value.location.longitude !== 'number'
    || !Number.isFinite(value.location.longitude)
    || value.location.longitude < -180
    || value.location.longitude > 180
    || typeof value.authorId !== 'string'
    || value.authorId.length === 0
    || (value.reportCount !== 0 && value.reportCount !== 1)
    || value.status !== 'visible'
    || !(value.createdAt instanceof Timestamp)
    || (value.type === 'other' && value.details.trim().length === 0)
  ) {
    throw new Error('A community observation has an invalid format.');
  }

  return {
    id,
    type: value.type,
    details: value.details,
    location: {
      latitude: value.location.latitude,
      longitude: value.location.longitude,
    },
    authorId: value.authorId,
    reportCount: value.reportCount,
    createdAt: value.createdAt,
  };
}

function boundingBox(center: FarmLocation) {
  const latitudeDelta = NEARBY_RADIUS_METERS / 110_574;
  const longitudeDelta = Math.min(
    180,
    NEARBY_RADIUS_METERS
      / (111_320 * Math.max(0.01, Math.cos((center.latitude * Math.PI) / 180))),
  );
  return {
    minLatitude: Math.max(-90, center.latitude - latitudeDelta),
    maxLatitude: Math.min(90, center.latitude + latitudeDelta),
    minLongitude: Math.max(-180, center.longitude - longitudeDelta),
    maxLongitude: Math.min(180, center.longitude + longitudeDelta),
  };
}

export async function getCommunityMapData(ownerId: string): Promise<CommunityMapData> {
  const farm = await getFarm(ownerId);
  if (!farm) return { farm: null, observations: [], hasMoreNearby: false };

  const bounds = boundingBox(farm.location);
  const observationsQuery = query(
    collection(getFirebaseDb(), OBSERVATIONS_COLLECTION),
    where('status', '==', 'visible'),
    where('location.latitude', '>=', bounds.minLatitude),
    where('location.latitude', '<=', bounds.maxLatitude),
    where('location.longitude', '>=', bounds.minLongitude),
    where('location.longitude', '<=', bounds.maxLongitude),
    orderBy('location.latitude', 'asc'),
    orderBy('location.longitude', 'asc'),
    limit(MAX_NEARBY_OBSERVATIONS + 1),
  );
  const snapshot = await getDocs(observationsQuery);
  const hasMoreNearby = snapshot.docs.length > MAX_NEARBY_OBSERVATIONS;
  const observations = snapshot.docs
    .slice(0, MAX_NEARBY_OBSERVATIONS)
    .map((observation) => parseObservation(observation.id, observation.data()))
    .filter((observation) => distanceMeters(farm.location, observation.location) <= NEARBY_RADIUS_METERS)
    .sort((first, second) => second.createdAt.toMillis() - first.createdAt.toMillis());

  return { farm, observations, hasMoreNearby };
}

export async function addCommunityObservation(
  ownerId: string,
  location: FarmLocation,
  type: CommunityObservationType,
  details: string,
  farmLocation: FarmLocation,
): Promise<void> {
  const normalizedDetails = details.trim();
  if (
    !VALID_TYPES.some((item) => item === type)
    || !Number.isFinite(location.latitude)
    || location.latitude < -90
    || location.latitude > 90
    || !Number.isFinite(location.longitude)
    || location.longitude < -180
    || location.longitude > 180
    || distanceMeters(farmLocation, location) > NEARBY_RADIUS_METERS
    || normalizedDetails.length > 240
    || (type === 'other' && normalizedDetails.length === 0)
  ) {
    throw new CommunityObservationValidationError();
  }

  await addDoc(collection(getFirebaseDb(), OBSERVATIONS_COLLECTION), {
    type,
    details: normalizedDetails,
    location: { latitude: location.latitude, longitude: location.longitude },
    authorId: ownerId,
    status: 'visible',
    reportCount: 0,
    createdAt: serverTimestamp(),
  });
}

export async function reportCommunityObservation(
  ownerId: string,
  observationId: string,
): Promise<CommunityReportResult> {
  if (observationId.trim().length === 0 || observationId.includes('/')) {
    throw new CommunityObservationValidationError();
  }

  const db = getFirebaseDb();
  const observationRef = doc(db, OBSERVATIONS_COLLECTION, observationId);
  const reportRef = doc(db, REPORTS_COLLECTION, ownerId, REPORTS_SUBCOLLECTION, observationId);

  return runTransaction(db, async (transaction) => {
    const reportSnapshot = await transaction.get(reportRef);
    if (reportSnapshot.exists()) return 'already-reported';

    const observationSnapshot = await transaction.get(observationRef);
    if (!observationSnapshot.exists()) throw new Error('This community observation is no longer available.');
    const observation = parseObservation(observationSnapshot.id, observationSnapshot.data());
    if (observation.authorId === ownerId) throw new CommunityObservationValidationError();

    const nextReportCount = observation.reportCount + 1;
    const nextStatus = nextReportCount >= 2 ? 'hidden' : 'visible';
    transaction.set(reportRef, {
      observationId,
      createdAt: serverTimestamp(),
    });
    transaction.update(observationRef, {
      reportCount: nextReportCount,
      status: nextStatus,
    });

    return nextStatus === 'hidden' ? 'hidden' : 'reported';
  });
}

export async function deleteCommunityObservation(observationId: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), OBSERVATIONS_COLLECTION, observationId));
}

export function getCommunityObservationErrorMessage(error: unknown, action: string): string {
  return getFirestoreErrorMessage(error, action);
}
