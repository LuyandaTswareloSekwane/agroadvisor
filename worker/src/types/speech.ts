export type SupportedSpeechLocale = 'af-ZA' | 'zu-ZA';

export interface SpeechRequest {
  locale: SupportedSpeechLocale;
  text: string;
}

export interface SpeechAudio {
  audioBase64: string;
  contentType: 'audio/mpeg';
}
