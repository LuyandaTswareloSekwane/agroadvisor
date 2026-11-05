import type { Timestamp } from 'firebase/firestore';
import type { CropId } from '../../../config/knowledge-base/crops';
import type { LivestockId } from '../../../config/knowledge-base/livestock';

export type { CropId, LivestockId };

export interface FarmLocation {
  latitude: number;
  longitude: number;
}

/** Number of animals kept, per livestock type. Farmers may add custom animal types. */
export type LivestockCounts = Record<string, number>;

/** Fields the farmer edits on the farm profile form. */
export interface FarmInput {
  name: string;
  /** Nearest town or village, shown to the farmer and on reports. */
  locationName: string;
  location: FarmLocation;
  sizeHectares: number;
  crops: string[];
  livestock: LivestockCounts;
  photoDataUrl: string | null;
}

/** Farm profile form state: text inputs are kept as strings until the form is submitted. */
export interface FarmFormValues {
  name: string;
  locationName: string;
  latitude: string;
  longitude: string;
  sizeHectares: string;
  crops: string[];
  livestock: Record<string, string>;
  photoDataUrl: string | null;
}

/** A farm stored at `farms/{ownerId}` in Cloud Firestore (one farm per farmer). */
export interface Farm extends FarmInput {
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
