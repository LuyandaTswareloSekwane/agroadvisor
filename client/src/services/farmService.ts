import { doc, getDoc, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import type { Farm, FarmInput, FarmLocation, LivestockCounts } from '../types/farm';
import { MAX_FARM_PHOTO_DATA_URL_LENGTH } from '../utils/farmForm';
import { getFirebaseDb } from './firebase';
import { getFirestoreErrorMessage } from './firestoreErrors';

/** One farm per farmer, stored at farms/{ownerId}. */
const FARMS_COLLECTION = 'farms';

function isCropName(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 60;
}

function isFarmLocation(value: unknown): value is FarmLocation {
  return (
    typeof value === 'object' &&
    value !== null &&
    'latitude' in value &&
    'longitude' in value &&
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number'
  );
}

function isLivestockCounts(value: unknown): value is LivestockCounts {
  if (typeof value !== 'object' || value === null) return false;
  return Object.entries(value).every(
    ([, count]: [string, unknown]) => typeof count === 'number' && Number.isInteger(count) && count >= 0,
  );
}

function isFarmPhoto(value: unknown): value is string | null {
  return value === null || (
    typeof value === 'string' &&
    value.length <= MAX_FARM_PHOTO_DATA_URL_LENGTH &&
    /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value)
  );
}

/** Checks a Firestore document against the Farm model so bad data never reaches the UI. */
function parseFarm(ownerId: string, data: Record<string, unknown>): Farm {
  const { name, locationName, location, sizeHectares, crops, livestock, photoDataUrl, createdAt, updatedAt } = data;
  const savedPhoto = photoDataUrl === undefined ? null : photoDataUrl;

  if (
    typeof name !== 'string' ||
    typeof locationName !== 'string' ||
    !isFarmLocation(location) ||
    typeof sizeHectares !== 'number' ||
    !Array.isArray(crops) ||
    crops.length > 50 ||
    !crops.every(isCropName) ||
    !isLivestockCounts(livestock) ||
    !isFarmPhoto(savedPhoto) ||
    !(createdAt instanceof Timestamp) ||
    !(updatedAt instanceof Timestamp)
  ) {
    throw new Error('The saved farm profile has an invalid format.');
  }

  return {
    ownerId,
    name,
    locationName,
    location: { latitude: location.latitude, longitude: location.longitude },
    sizeHectares,
    crops,
    livestock,
    photoDataUrl: savedPhoto,
    createdAt,
    updatedAt,
  };
}

/** Returns the farmer's farm, or null if they have not set one up yet. */
export async function getFarm(ownerId: string): Promise<Farm | null> {
  const snapshot = await getDoc(doc(getFirebaseDb(), FARMS_COLLECTION, ownerId));
  return snapshot.exists() ? parseFarm(ownerId, snapshot.data()) : null;
}

/** Creates the farm on first save; afterwards replaces the editable fields and keeps createdAt. */
export async function saveFarm(ownerId: string, input: FarmInput, isNew: boolean): Promise<void> {
  const ref = doc(getFirebaseDb(), FARMS_COLLECTION, ownerId);
  const fields = { ownerId, ...input, updatedAt: serverTimestamp() };

  if (isNew) {
    await setDoc(ref, { ...fields, createdAt: serverTimestamp() });
  } else {
    // updateDoc replaces each top-level field, so removed crops and livestock are removed too.
    await updateDoc(ref, fields);
  }
}

export function getFarmLoadErrorMessage(error: unknown): string {
  return getFirestoreErrorMessage(error, 'load your farm profile');
}

export function getFarmSaveErrorMessage(error: unknown): string {
  return getFirestoreErrorMessage(error, 'save your farm profile');
}
