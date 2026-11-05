import { Hono } from 'hono';
import { fail, ok } from '../lib/response';
import { requireFirebaseAuth } from '../middleware/firebaseAuth';
import {
  identifyFarmImage,
  InvalidVisionInputError,
  VisionProviderError,
} from '../services/visionService';
import type { AppEnv } from '../types/env';

export const visionRoutes = new Hono<AppEnv>();

visionRoutes.use('*', requireFirebaseAuth);

visionRoutes.post('/identify', async (c) => {
  const contentLength = Number(c.req.header('Content-Length'));
  if (Number.isFinite(contentLength) && contentLength > 6.5 * 1024 * 1024) {
    return fail(c, 'Choose an image smaller than 6 MB', 413);
  }

  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return fail(c, 'Upload an image to identify', 400);
  }

  const image = form.get('image');
  const itemType = form.get('itemType');
  if (!(image instanceof File)) {
    return fail(c, 'Upload an image to identify', 400);
  }
  if (itemType !== 'crop_product' && itemType !== 'livestock') {
    return fail(c, 'Choose crops and products or livestock for this image', 400);
  }

  try {
    const result = await identifyFarmImage(c.env, image, itemType);
    return ok(c, result, 'Image recognition complete');
  } catch (error) {
    if (error instanceof InvalidVisionInputError) {
      return fail(c, error.message, 400);
    }
    if (error instanceof VisionProviderError) {
      return fail(c, error.message, 502);
    }
    console.error('Farm image recognition failed:', error);
    return fail(c, 'Image recognition failed. Please try again.', 500);
  }
});
