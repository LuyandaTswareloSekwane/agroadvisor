import { Hono } from 'hono';
import { FirestoreRestError } from '../lib/firestoreRest';
import { fail, ok } from '../lib/response';
import { requireFirebaseAuth } from '../middleware/firebaseAuth';
import { getRegionalTemperatureGrid } from '../services/regionalWeatherService';
import { FarmNotFoundError, getFarmWeatherForecast, InvalidFarmLocationError, WeatherProviderError } from '../services/weatherService';
import type { AppEnv } from '../types/env';

export const weatherRoutes = new Hono<AppEnv>();

weatherRoutes.use('*', requireFirebaseAuth);

weatherRoutes.get('/forecast', async (c) => {
  const authorization = c.req.header('Authorization');
  const userToken = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!userToken) {
    return fail(c, 'A valid Firebase ID token is required', 401);
  }

  try {
    const user = c.get('firebaseUser');
    const forecast = await getFarmWeatherForecast(c.env, user.uid, userToken);
    return ok(c, forecast, 'Farm weather forecast loaded');
  } catch (error) {
    if (error instanceof FarmNotFoundError) {
      return fail(c, error.message, 404);
    }
    if (error instanceof InvalidFarmLocationError) {
      console.error('Saved farm location is invalid.');
      return fail(c, 'Update your farm profile with a valid location before requesting a forecast', 422);
    }
    if (error instanceof WeatherProviderError) {
      return fail(c, error.message, 502);
    }
    if (error instanceof FirestoreRestError) {
      if (error.status === 401 || error.status === 403) {
        return fail(c, 'Your farm profile could not be accessed. Sign in again and retry', 403);
      }
      console.error('Could not read farm profile from Firestore:', error.message);
      return fail(c, 'Your farm profile could not be loaded', error.status >= 500 ? 502 : 500);
    }
    console.error('Farm weather forecast failed:', error);
    return fail(c, 'Could not load the farm weather forecast', 500);
  }
});

weatherRoutes.get('/temperature-grid', async (c) => {
  const latitude = Number(c.req.query('latitude'));
  const longitude = Number(c.req.query('longitude'));
  if (
    !c.req.query('latitude') ||
    !c.req.query('longitude') ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return fail(c, 'Provide a valid latitude and longitude', 400);
  }

  try {
    const points = await getRegionalTemperatureGrid(latitude, longitude);
    return ok(c, points, 'Nearby temperatures loaded');
  } catch (error) {
    if (error instanceof WeatherProviderError) {
      return fail(c, error.message, 502);
    }
    console.error('Nearby temperature grid failed:', error);
    return fail(c, 'Could not load nearby temperatures', 500);
  }
});
