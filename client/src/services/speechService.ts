import type { ApiResponse } from '../types/api';
import { requestWorker, WorkerApiError } from './workerApi';

interface SpeechAudio {
  audioBase64: string;
  contentType: 'audio/mpeg';
}

function isSpeechAudio(value: unknown): value is SpeechAudio {
  return (
    typeof value === 'object' &&
    value !== null &&
    'audioBase64' in value &&
    typeof value.audioBase64 === 'string' &&
    'contentType' in value &&
    value.contentType === 'audio/mpeg'
  );
}

export async function synthesizeWarning(text: string, locale: 'af-ZA' | 'zu-ZA'): Promise<Blob> {
  const response: ApiResponse<unknown> = await requestWorker<unknown>('/api/speech/synthesize', {
    method: 'POST',
    body: JSON.stringify({ locale, text }),
  });
  if (!isSpeechAudio(response.data)) {
    throw new WorkerApiError('Online speech returned invalid audio data.', 502);
  }

  const binary = atob(response.data.audioBase64);
  const audioBytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    audioBytes[index] = binary.charCodeAt(index);
  }
  const audioBuffer = new ArrayBuffer(audioBytes.byteLength);
  new Uint8Array(audioBuffer).set(audioBytes);
  return new Blob([audioBuffer], { type: response.data.contentType });
}
