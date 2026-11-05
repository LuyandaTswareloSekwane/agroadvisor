import { Hono } from 'hono';
import { fail, ok } from '../lib/response';
import { requireFirebaseAuth } from '../middleware/firebaseAuth';
import {
  SpeechConfigurationError,
  SpeechProviderError,
  synthesizeSpeech,
} from '../services/speechService';
import type { SpeechRequest } from '../types/speech';
import type { AppEnv } from '../types/env';

export const speechRoutes = new Hono<AppEnv>();

speechRoutes.use('*', requireFirebaseAuth);

function isSpeechRequest(value: unknown): value is SpeechRequest {
  if (typeof value !== 'object' || value === null || !('locale' in value) || !('text' in value)) {
    return false;
  }
  const { locale, text } = value;
  return (
    (locale === 'af-ZA' || locale === 'zu-ZA') &&
    typeof text === 'string' &&
    text.trim().length > 0 &&
    text.length <= 4000
  );
}

speechRoutes.post('/synthesize', async (c) => {
  const contentLength = Number(c.req.header('Content-Length'));
  if (Number.isFinite(contentLength) && contentLength > 12 * 1024) {
    return fail(c, 'The warning text is too long', 413);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return fail(c, 'Provide a language and warning text', 400);
  }
  if (!isSpeechRequest(body)) {
    return fail(c, 'Choose Afrikaans or isiZulu and provide warning text under 4,000 characters', 400);
  }

  try {
    const audio = await synthesizeSpeech(c.env, body.locale, body.text.trim());
    return ok(c, audio, 'Warning speech generated');
  } catch (error) {
    if (error instanceof SpeechConfigurationError) {
      return fail(c, error.message, 503);
    }
    if (error instanceof SpeechProviderError) {
      return fail(c, error.message, error.status);
    }
    console.error('Online warning speech failed:', error);
    return fail(c, 'Online speech could not be generated', 502);
  }
});
