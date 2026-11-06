import type { VisionItemType, VisionRecognition } from '../types/vision';
import { requestWorker } from './workerApi';

/** Sends a farm photo to the authenticated Worker for Gemini image recognition. */
export async function identifyFarmImage(file: File, itemType: VisionItemType, language: string): Promise<VisionRecognition> {
  const form = new FormData();
  form.set('image', file);
  form.set('itemType', itemType);
  form.set('language', language);

  const response = await requestWorker<VisionRecognition>('/api/vision/identify', {
    method: 'POST',
    body: form,
  });
  if (!response.data) {
    throw new Error('Image recognition returned no result.');
  }
  return response.data;
}
