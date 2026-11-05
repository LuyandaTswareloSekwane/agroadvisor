import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Farm } from '../../types/farm';
import { getPrimaryWeatherAlert, getWeatherAdvice, isWeatherAlertImminent, isWeatherHazard } from '../../utils/weatherAdvice';
import { getFarmWeatherForecast } from '../../services/weatherService';
import { synthesizeWarning } from '../../services/speechService';
import { WorkerApiError } from '../../services/workerApi';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLanguage } from '../../hooks/useLanguage';
import { LANGUAGE_LOCALES, LANGUAGE_NAMES, type AppLanguage } from '../../i18n';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { PageLoader } from '../ui/PageLoader';
import { WeatherGuideIllustration } from './WeatherGuideIllustration';
import { FarmSummary } from './FarmSummary';
import { WeeklyOutlook } from './WeeklyOutlook';

interface WeatherAdvisoryProps {
  ownerId: string;
  farm: Farm;
  firstName?: string;
}

function getForecastErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function getConciseAdvice(advice: string): string {
  const action = advice.slice(advice.indexOf(':') + 1).trim();
  return `${action.split('. ')[0] ?? action}.`;
}

function findVoice(voices: SpeechSynthesisVoice[], language: AppLanguage): SpeechSynthesisVoice | null {
  const locale = LANGUAGE_LOCALES[language].toLowerCase();
  return (
    voices.find((voice) => voice.lang.toLowerCase() === locale) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(`${language}-`)) ??
    voices.find((voice) => voice.lang.toLowerCase() === language) ??
    null
  );
}

function waitForLanguageVoice(language: AppLanguage): Promise<SpeechSynthesisVoice | null> {
  const synthesis = window.speechSynthesis;
  const availableVoice = findVoice(synthesis.getVoices(), language);
  if (availableVoice) return Promise.resolve(availableVoice);

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      synthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      resolve(findVoice(synthesis.getVoices(), language));
    };
    const handleVoicesChanged = () => {
      if (findVoice(synthesis.getVoices(), language)) finish();
    };
    const timeout = window.setTimeout(finish, 1200);
    synthesis.addEventListener('voiceschanged', handleVoicesChanged);
  });
}

export function WeatherAdvisory({ ownerId, farm, firstName }: WeatherAdvisoryProps) {
  const { language, t } = useLanguage();
  const forecast = useAsyncData(ownerId, getFarmWeatherForecast);
  const [dismissedAlertKey, setDismissedAlertKey] = useState<string | null>(() => {
    try {
      return window.sessionStorage.getItem(`agroadvisor-dismissed-warning:${ownerId}`);
    } catch {
      return null;
    }
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const dialog = useRef<HTMLElement>(null);
  const audioPlayer = useRef<HTMLAudioElement | null>(null);
  const audioUrl = useRef<string | null>(null);
  const spokenAlertKey = useRef<string | null>(null);
  const speechAttempt = useRef(0);
  const alerts = useMemo(
    () => (forecast.data ? getWeatherAdvice(forecast.data, farm, language) : []),
    [forecast.data, farm, language],
  );
  const primaryAlert = getPrimaryWeatherAlert(alerts);
  const alertKey = primaryAlert?.id ?? '';
  const primaryHazard = primaryAlert?.id.slice(0, primaryAlert.id.indexOf(':')) ?? '';
  const isCritical = primaryAlert?.severity === 'critical';
  const isImminent = Boolean(
    primaryAlert && forecast.data && isWeatherAlertImminent(primaryAlert, forecast.data.current.time),
  );
  const isPopupOpen = isImminent && dismissedAlertKey !== alertKey;

  const clearAudio = useCallback(() => {
    const player = audioPlayer.current;
    if (player) {
      player.onplay = null;
      player.onended = null;
      player.onerror = null;
      player.pause();
      player.removeAttribute('src');
      player.load();
      audioPlayer.current = null;
    }
    if (audioUrl.current) {
      URL.revokeObjectURL(audioUrl.current);
      audioUrl.current = null;
    }
  }, []);

  const stopPlayback = useCallback(() => {
    speechAttempt.current += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    clearAudio();
    setIsSpeaking(false);
  }, [clearAudio]);

  const speakWarning = useCallback(async () => {
    setVoiceError(null);
    const attempt = ++speechAttempt.current;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    clearAudio();
    setIsSpeaking(false);
    if (!primaryAlert) return;
    const message = `${isCritical ? t('weather.severeWarning') : t('weather.warning')}. ${primaryAlert.title}. ${primaryAlert.date}. ${getConciseAdvice(primaryAlert.advice)}`;
    let onlineSpeechError: unknown = null;
    let onlinePlaybackFailed = false;

    if (language === 'af' || language === 'zu') {
      try {
        const onlineLocale = language === 'af' ? 'af-ZA' : 'zu-ZA';
        const audio = await synthesizeWarning(message, onlineLocale);
        if (speechAttempt.current !== attempt) return;
        const source = URL.createObjectURL(audio);
        const player = new Audio(source);
        audioUrl.current = source;
        audioPlayer.current = player;
        player.onplay = () => {
          if (speechAttempt.current === attempt) setIsSpeaking(true);
        };
        player.onended = () => {
          if (speechAttempt.current === attempt) {
            setIsSpeaking(false);
            clearAudio();
          }
        };
        player.onerror = () => {
          if (speechAttempt.current === attempt) {
            setIsSpeaking(false);
            clearAudio();
            setVoiceError(t('weather.voiceFailed'));
          }
        };
        try {
          await player.play();
          return;
        } catch {
          if (speechAttempt.current !== attempt) return;
          clearAudio();
          onlinePlaybackFailed = true;
        }
      } catch (error) {
        if (speechAttempt.current !== attempt) return;
        onlineSpeechError = error;
      }
    }

    if (!('speechSynthesis' in window)) {
      if (onlineSpeechError instanceof WorkerApiError && onlineSpeechError.status === 429) {
        setVoiceError(t('weather.cloudVoiceLimit'));
      } else {
        setVoiceError(onlineSpeechError ? t('weather.cloudVoiceUnavailable') : t('weather.voiceUnavailable'));
      }
      return;
    }

    const selectedVoice = await waitForLanguageVoice(language);
    if (speechAttempt.current !== attempt) return;
    if (!selectedVoice) {
      setIsSpeaking(false);
      if (onlineSpeechError instanceof WorkerApiError && onlineSpeechError.status === 429) {
        setVoiceError(t('weather.cloudVoiceLimit'));
      } else if (onlineSpeechError) {
        setVoiceError(t('weather.cloudVoiceUnavailable'));
      } else if (onlinePlaybackFailed) {
        setVoiceError(t('weather.voiceFailed'));
      } else {
        setVoiceError(t('weather.voiceMissing', { language: LANGUAGE_NAMES[language] }));
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = LANGUAGE_LOCALES[language];
    utterance.voice = selectedVoice;
    utterance.rate = 0.86;
    utterance.volume = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      setIsSpeaking(false);
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        setVoiceError(t('weather.voiceFailed'));
      }
    };
    setVoiceError(null);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [clearAudio, isCritical, language, primaryAlert, t]);

  useEffect(() => {
    stopPlayback();
    setVoiceError(null);
  }, [language, stopPlayback]);

  const dismissWarning = useCallback(() => {
    stopPlayback();
    setDismissedAlertKey(alertKey);
    try {
      window.sessionStorage.setItem(`agroadvisor-dismissed-warning:${ownerId}`, alertKey);
    } catch {
      setDismissedAlertKey(alertKey);
    }
  }, [alertKey, ownerId, stopPlayback]);

  function readWarningAloud() {
    if (isSpeaking) {
      stopPlayback();
      return;
    }
    speakWarning();
  }

  useEffect(() => {
    if (!isPopupOpen) return;
    dialog.current?.focus();
    const spokenKey = `${alertKey}:${language}`;
    const timer = spokenAlertKey.current === spokenKey
      ? undefined
      : window.setTimeout(() => {
          spokenAlertKey.current = spokenKey;
          speakWarning();
        }, 300);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') dismissWarning();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [alertKey, dismissWarning, isPopupOpen, language, speakWarning]);

  useEffect(
    () => () => {
      speechAttempt.current += 1;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      clearAudio();
    },
    [clearAudio],
  );

  return (
    <>
      <FarmSummary farm={farm} firstName={firstName} forecast={forecast.data} />
      {forecast.isLoading && <PageLoader label={t('weather.title')} />}
      {forecast.error !== null && (
        <div className="space-y-3">
          <Alert tone="error">{getForecastErrorMessage(forecast.error, t('weather.loadError'))}</Alert>
          <Button variant="secondary" onClick={forecast.reload}>
            {t('weather.tryAgain')}
          </Button>
        </div>
      )}
      {forecast.data && (
        <WeeklyOutlook forecast={forecast.data} alerts={alerts} onRefresh={forecast.reload} />
      )}

      {isPopupOpen && (
        <div className={`fixed inset-0 z-[2000] flex items-center justify-center p-3 backdrop-blur-md sm:p-4 ${
          isCritical ? 'bg-red-950/70' : 'bg-soil-950/50'
        }`}>
          <section
            ref={dialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="weather-warning-title"
            tabIndex={-1}
            className={`max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border p-5 shadow-2xl focus:outline-none sm:p-6 ${
              isCritical
                ? 'border-red-300 bg-red-50/95 shadow-red-950/40'
                : 'glass-surface border-white/65'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <span className={`warning-beacon relative flex h-20 w-20 items-center justify-center rounded-full border-2 ${
                isCritical
                  ? 'border-red-400 bg-red-100 text-red-800 shadow-xl shadow-red-900/20'
                  : 'border-amber-300 bg-amber-50 text-amber-800 shadow-lg'
              }`}>
                <svg viewBox="0 0 48 48" className="relative z-10 h-12 w-12" aria-hidden="true">
                  <path d="M24 5 3.8 41h40.4L24 5Z" fill="#fff" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
                  <path d="M24 16v12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="24" cy="34" r="2.5" fill="currentColor" />
                </svg>
              </span>
              <p className={`mt-4 text-sm font-black uppercase tracking-[0.2em] ${
                isCritical ? 'text-red-800' : 'text-amber-800'
              }`}>
                {isCritical ? t('weather.severeWarning') : t('weather.warning')}
              </p>
            </div>
            {primaryAlert && (
              <>
                <h2 id="weather-warning-title" className="mt-2 text-center text-xl font-black text-soil-900 sm:text-2xl">
                  {primaryAlert.title}
                </h2>
                <p className="mt-1 text-center text-sm font-bold text-soil-700">
                  {primaryAlert.date}
                </p>
                {isWeatherHazard(primaryHazard) && (
                  <div className={`mt-4 space-y-3 rounded-2xl border p-3 ${
                    isCritical                     ? 'border-red-200 bg-red-50/90' : 'border-amber-200 bg-amber-50/85'
                  }`}>
                    <WeatherGuideIllustration hazard={primaryHazard} compact />
                    <p className="text-sm font-semibold leading-5 text-soil-900">
                    {getConciseAdvice(primaryAlert.advice)}
                    </p>
                  </div>
                )}
              </>
            )}
            <Button variant="secondary" fullWidth className="mt-4" onClick={readWarningAloud}>
              {isSpeaking ? t('weather.stopVoice') : t('weather.readAloud')}
            </Button>
            {voiceError && <p role="status" className="mt-2 text-sm text-red-700">{voiceError}</p>}
            <Button className="mt-3" fullWidth onClick={dismissWarning}>
              {t('weather.understand')}
            </Button>
          </section>
        </div>
      )}
    </>
  );
}
