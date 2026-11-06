import type { Env } from '../types/env';
import type { VisionItemType, VisionRecognition } from '../types/vision';

const GEMINI_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.6-flash'] as const;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export type VisionLanguage = 'en' | 'af' | 'zu' | 'st' | 'tn';
export const VISION_LANGUAGES: readonly VisionLanguage[] = ['en', 'af', 'zu', 'st', 'tn'];
const LANGUAGE_NAMES: Record<VisionLanguage, string> = {
  en: 'English',
  af: 'Afrikaans',
  zu: 'isiZulu',
  st: 'Sesotho',
  tn: 'Setswana',
};

interface ModelRecognition {
  itemName: string | null;
  confidence: number;
  alternatives: string[];
  isRelevant: boolean;
  localName: string | null;
}

export class InvalidVisionInputError extends Error {}

export class VisionProviderError extends Error {}

class GeminiModelBusyError extends VisionProviderError {
  constructor() {
    super('Image recognition is temporarily busy. Please wait a moment and rescan.');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function parseModelRecognition(text: string): ModelRecognition {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new VisionProviderError('The image recognition service returned an unreadable result.');
  }

  if (!isRecord(value)) {
    throw new VisionProviderError('The image recognition service returned an incomplete result.');
  }

  const parsedItemName = typeof value.itemName === 'string' ? value.itemName.trim() : '';
  if (parsedItemName.length > 60) {
    throw new VisionProviderError('The image recognition service returned an invalid item name.');
  }
  const itemName = parsedItemName || null;
  const confidence = typeof value.confidence === 'number' ? value.confidence : Number.NaN;
  const alternatives = Array.isArray(value.alternatives)
    ? value.alternatives.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, 3)
    : [];

  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1 || typeof value.isRelevant !== 'boolean') {
    throw new VisionProviderError('The image recognition service returned an invalid result.');
  }

  const parsedLocalName = typeof value.localName === 'string' ? value.localName.trim() : '';
  const localName = parsedLocalName && parsedLocalName.length <= 60 ? parsedLocalName : null;

  return {
    itemName: itemName || null,
    confidence,
    alternatives,
    isRelevant: value.isRelevant,
    localName,
  };
}

function toRecognition(result: ModelRecognition): VisionRecognition {
  if (!result.isRelevant || !result.itemName || result.confidence < 0.5) {
    return { status: 'unknown', itemName: null, confidence: result.confidence, alternatives: [] };
  }

  if (result.confidence >= 0.8) {
    return {
      status: 'identified',
      itemName: result.itemName,
      confidence: result.confidence,
      alternatives: [],
      localName: result.localName,
    };
  }

  return {
    status: 'uncertain',
    itemName: result.itemName,
    confidence: result.confidence,
    alternatives: result.alternatives,
    localName: result.localName,
  };
}

export async function identifyFarmImage(
  env: Env,
  image: File,
  itemType: VisionItemType,
  language: VisionLanguage = 'en',
): Promise<VisionRecognition> {
  if (!env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not configured for the Worker.');
    throw new VisionProviderError('Image recognition is not configured yet. You can still enter the name manually.');
  }
  if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
    throw new InvalidVisionInputError('Use a JPEG, PNG, or WebP image.');
  }
  if (image.size === 0 || image.size > MAX_IMAGE_BYTES) {
    throw new InvalidVisionInputError('Choose an image smaller than 6 MB.');
  }

  const itemDescription =
    itemType === 'livestock'
      ? 'the primary farm animal or livestock species'
      : 'the primary crop, fruit, vegetable, seed, or farm product';
  const prompt = [
    `Identify ${itemDescription} shown in this image.`,
    'Return itemName as a short string (or an empty string if you cannot identify it), confidence as a number from 0 to 1, alternatives as an array of up to 3 short likely names, and isRelevant as a boolean.',
    'Only identify an item that is visibly supported by the image. Do not infer from the filename or invent details.',
    'Set itemName to an empty string, confidence to 0, alternatives to [], and isRelevant to false if the image is blank, unclear, unrelated, or does not show an identifiable farm item.',
    'Use a specific everyday name only when the visible evidence supports it. Confidence is your estimated certainty in the top name.',
    language === 'en'
      ? 'Set localName to an empty string.'
      : `Also set localName to the common name of the identified item in ${LANGUAGE_NAMES[language]}, or an empty string if you do not know a reliable ${LANGUAGE_NAMES[language]} name. Keep itemName in English.`,
  ].join(' ');

  const bytes = new Uint8Array(await image.arrayBuffer());
  let lastFailure: 'busy' | 'network' | 'provider' = 'busy';

  for (const model of GEMINI_MODELS) {
    let response: Response;
    try {
      response = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        signal: AbortSignal.timeout(20_000),
        body: JSON.stringify({
          model,
          store: false,
          input: [
            { type: 'text', text: prompt },
            { type: 'image', data: toBase64(bytes), mime_type: image.type },
          ],
          response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema: {
              type: 'object',
              properties: {
                itemName: { type: 'string' },
                confidence: { type: 'number' },
                alternatives: { type: 'array', items: { type: 'string' } },
                localName: { type: 'string' },
                isRelevant: { type: 'boolean' },
              },
              required: ['itemName', 'confidence', 'alternatives', 'isRelevant'],
            },
          },
        }),
      });
    } catch (error) {
      console.error(`Gemini image recognition request failed for ${model}:`, error);
      lastFailure = 'network';
      continue;
    }

    if (response.status === 429 || response.status === 503) {
      console.warn(`Gemini model ${model} is unavailable for image recognition: ${response.status}`);
      lastFailure = 'busy';
      continue;
    }
    if (response.status === 401 || response.status === 403) {
      console.error('Gemini rejected the Worker API key:', response.status);
      throw new VisionProviderError('Gemini did not accept the Worker API key. Check the key in Worker settings.');
    }
    if (response.status === 404) {
      console.warn(`Gemini model ${model} is not available for this API key.`);
      lastFailure = 'provider';
      continue;
    }
    if (!response.ok) {
      console.error(`Gemini image recognition returned an error for ${model}:`, response.status);
      lastFailure = 'provider';
      continue;
    }

    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch (error) {
      console.error('Gemini image recognition returned invalid JSON:', error);
      throw new VisionProviderError('Image recognition returned an invalid result. Please try again.');
    }

    const steps = isRecord(responseData) ? responseData.steps : null;
    const modelOutput = Array.isArray(steps)
      ? [...steps].reverse().find((step) => isRecord(step) && step.type === 'model_output')
      : undefined;
    const parts = isRecord(modelOutput) ? modelOutput.content : null;
    const text = Array.isArray(parts)
      ? parts.find((part) => isRecord(part) && typeof part.text === 'string')?.text
      : undefined;
    if (typeof text !== 'string') {
      throw new VisionProviderError('Image recognition could not identify an item in this photo.');
    }

    return toRecognition(parseModelRecognition(text));
  }

  if (lastFailure === 'busy') {
    throw new GeminiModelBusyError();
  }
  if (lastFailure === 'network') {
    throw new VisionProviderError('Could not reach image recognition. Check your connection and try again.');
  }
  throw new VisionProviderError('Image recognition is unavailable for this API key. Please contact support or enter the name manually.');
}
