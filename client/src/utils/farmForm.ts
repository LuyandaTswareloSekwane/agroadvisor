import type { Farm, FarmFormValues, FarmInput, LivestockCounts } from '../types/farm';

/** Decimal places kept for coordinates: 5 places is about 1 m, more than enough for a farm. */
export const COORDINATE_DECIMALS = 5;
export const MAX_FARM_PHOTO_DATA_URL_LENGTH = 100_000;
export const ACRES_PER_HECTARE = 2.47105;

export function hectaresToAcres(sizeHectares: number): number {
  return sizeHectares * ACRES_PER_HECTARE;
}

/** Downsizes a chosen farm photo before keeping it in the owner's Firestore profile. */
export async function prepareFarmPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Unsupported farm photo type.');
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('Farm photo exceeds the upload limit.');
  }

  const image = await createImageBitmap(file);
  try {
    let scale = Math.min(1, 512 / Math.max(image.width, image.height));
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Farm photo could not be prepared.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.68 - attempt * 0.08);
      if (dataUrl.length <= MAX_FARM_PHOTO_DATA_URL_LENGTH) return dataUrl;
      scale *= 0.75;
    }
    throw new Error('Farm photo could not be reduced to the storage limit.');
  } finally {
    image.close();
  }
}

export function formatCoordinate(value: number): string {
  return value.toFixed(COORDINATE_DECIMALS);
}

/** Form values for editing an existing farm, or an empty form for a new one. */
export function toFarmFormValues(farm: Farm | null): FarmFormValues {
  if (!farm) {
    return {
      name: '',
      locationName: '',
      latitude: '',
      longitude: '',
      sizeHectares: '',
      crops: [],
      livestock: {},
      photoDataUrl: null,
    };
  }

  const livestock: FarmFormValues['livestock'] = {};
  for (const [id, count] of Object.entries(farm.livestock)) {
    if (count > 0) livestock[id] = String(count);
  }

  return {
    name: farm.name,
    locationName: farm.locationName,
    latitude: formatCoordinate(farm.location.latitude),
    longitude: formatCoordinate(farm.location.longitude),
    sizeHectares: String(farm.sizeHectares),
    crops: farm.crops,
    livestock,
    photoDataUrl: farm.photoDataUrl,
  };
}

/** Converts validated form values into the saved model. Livestock with no animals is left out. */
export function toFarmInput(values: FarmFormValues): FarmInput {
  const livestock: LivestockCounts = {};
  for (const [id, countValue] of Object.entries(values.livestock)) {
    const count = Number(countValue ?? '');
    if (count > 0) livestock[id] = count;
  }

  return {
    name: values.name.trim(),
    locationName: values.locationName.trim(),
    location: { latitude: Number(values.latitude), longitude: Number(values.longitude) },
    sizeHectares: Number(values.sizeHectares),
    crops: values.crops,
    livestock,
    photoDataUrl: values.photoDataUrl,
  };
}
