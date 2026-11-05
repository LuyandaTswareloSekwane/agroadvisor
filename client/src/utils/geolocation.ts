import type { FarmLocation } from '../types/farm';

/** Asks the browser for the device's current position, with plain-language errors. */
export function getCurrentLocation(): Promise<FarmLocation> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Your browser cannot share its location. Choose your farm on the map instead.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => {
        const messages: Record<number, string> = {
          [error.PERMISSION_DENIED]:
            'Location access was blocked. Allow it in your browser settings, or choose your farm on the map.',
          [error.POSITION_UNAVAILABLE]:
            'Your location could not be found. Choose your farm on the map instead.',
          [error.TIMEOUT]: 'Finding your location took too long. Try again or choose your farm on the map.',
        };
        reject(new Error(messages[error.code] ?? 'Your location could not be found.'));
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  });
}
