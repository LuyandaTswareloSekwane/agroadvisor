import type { Env } from '../types/env';
import type { SpeechAudio, SupportedSpeechLocale } from '../types/speech';

const VOICE_BY_LOCALE: Record<SupportedSpeechLocale, string> = {
  'af-ZA': 'af-ZA-AdriNeural',
  'zu-ZA': 'zu-ZA-ThandoNeural',
};

export class SpeechConfigurationError extends Error {
  constructor() {
    super('Online speech is not configured.');
    this.name = 'SpeechConfigurationError';
  }
}

export class SpeechProviderError extends Error {
  constructor(
    message: string,
    public readonly status: 429 | 502,
  ) {
    super(message);
    this.name = 'SpeechProviderError';
  }
}

function escapeXml(text: string): string {
  return text.replace(/[<>&'"]/g, (character) => {
    switch (character) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      default:
        return '&quot;';
    }
  });
}

function encodeBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

export async function synthesizeSpeech(env: Env, locale: SupportedSpeechLocale, text: string): Promise<SpeechAudio> {
  const key = env.AZURE_SPEECH_KEY?.trim();
  const region = env.AZURE_SPEECH_REGION?.trim().toLowerCase();
  if (!key || !region || !/^[a-z0-9-]+$/.test(region)) {
    throw new SpeechConfigurationError();
  }

  let response: Response;
  try {
    response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ssml+xml',
        'Ocp-Apim-Subscription-Key': key,
        'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
        'User-Agent': 'AgroAdvisor',
      },
      body: `<speak version="1.0" xml:lang="${locale}"><voice name="${VOICE_BY_LOCALE[locale]}">${escapeXml(text)}</voice></speak>`,
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new SpeechProviderError('Online speech timed out.', 502);
    }
    throw new SpeechProviderError('Online speech could not be reached.', 502);
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new SpeechProviderError('The free online speech limit is unavailable right now.', 429);
    }
    throw new SpeechProviderError('Online speech could not be generated.', 502);
  }

  const audio = await response.arrayBuffer();
  if (audio.byteLength === 0) {
    throw new SpeechProviderError('Online speech returned no audio.', 502);
  }

  return { audioBase64: encodeBase64(audio), contentType: 'audio/mpeg' };
}
