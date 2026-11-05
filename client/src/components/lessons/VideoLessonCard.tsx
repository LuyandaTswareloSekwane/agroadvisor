import { useId, useState } from 'react';
import { LANGUAGE_LOCALES, LANGUAGE_NAMES } from '../../i18n';
import type { VideoLesson } from '../../types/lesson';
import { useLanguage } from '../../hooks/useLanguage';
import { Button } from '../ui/Button';
import { LessonStepIcon } from './LessonStepIcon';

interface VideoLessonCardProps {
  lesson: VideoLesson;
  completionStatus: 'available' | 'completed' | null;
  isCompleting: boolean;
  isCompletionPending: boolean;
  onComplete: () => void;
}

function formatDuration(seconds: number, language: string): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formattedSeconds = new Intl.NumberFormat(language, { minimumIntegerDigits: 2 }).format(remainingSeconds);
  return `${minutes}:${formattedSeconds}`;
}

export function VideoLessonCard({
  lesson,
  completionStatus,
  isCompleting,
  isCompletionPending,
  onComplete,
}: VideoLessonCardProps) {
  const { language, t } = useLanguage();
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const playerId = useId();
  const embedUrl = `https://www.youtube-nocookie.com/embed/${lesson.youtubeId}?rel=0`;
  const sourceUrl = `https://www.youtube.com/watch?v=${lesson.youtubeId}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-leaf-100 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="bg-gradient-to-r from-leaf-700 via-emerald-600 to-citrus-400 p-[1px]">
        <div className="flex flex-wrap items-start justify-between gap-3 bg-gradient-to-br from-white via-leaf-50/60 to-wheat-50/70 p-4">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold leading-6 text-leaf-900">{lesson.title}</h3>
            <p className="mt-1 text-xs font-medium text-soil-600">
              {t('lesson.duration')}: {formatDuration(lesson.durationSeconds, LANGUAGE_LOCALES[language])}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-leaf-200 bg-white px-2.5 py-1 text-[10px] font-bold text-leaf-800">
              {t('lesson.reviewed')}
            </span>
            <span className="rounded-full border border-citrus-300 bg-wheat-100 px-2.5 py-1 text-[10px] font-bold text-soil-800">
              {t('lesson.englishContent')}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <p className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm leading-5 text-sky-950">
          {t('lesson.contentLanguage', { language: LANGUAGE_NAMES[lesson.language] })}
        </p>

        <p className="text-sm leading-6 text-soil-700">{lesson.summary}</p>

        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-[0.12em] text-soil-500">{t('lesson.keySteps')}</h4>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {lesson.keySteps.map((step, index) => (
              <li key={`${lesson.id}-${index}`} className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-leaf-50/70 to-white p-2">
                <LessonStepIcon icon={step.icon} />
                <span className="text-sm font-medium leading-5 text-soil-800">{step.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {completionStatus === 'available' && (
          <Button
            variant="secondary"
            fullWidth
            isLoading={isCompleting}
            disabled={isCompletionPending && !isCompleting}
            onClick={onComplete}
          >
            {isCompleting ? t('lesson.completing') : t('lesson.complete')}
          </Button>
        )}
        {completionStatus === 'completed' && (
          <p className="flex items-center gap-2 rounded-xl border border-leaf-200 bg-leaf-50 px-3 py-2 text-sm font-semibold text-leaf-900" role="status">
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 4 4L19 6" />
            </svg>
            {t('lesson.completed')}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-soil-100 pt-3">
          <p className="text-xs text-soil-600">
            {t('lesson.source')}: <span className="font-bold text-soil-800">{lesson.sourceChannel}</span>
            {' · '}
            {t('lesson.videoLanguage')}: {LANGUAGE_NAMES[lesson.language]}
          </p>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-leaf-800 underline decoration-leaf-300 underline-offset-2 hover:text-leaf-600"
          >
            {t('lesson.sourceVideo')}
          </a>
        </div>

        <button
          type="button"
          aria-expanded={isPlayerOpen}
          aria-controls={playerId}
          onClick={() => setIsPlayerOpen((current) => !current)}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-leaf-700 via-leaf-600 to-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-leaf-800/15 transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500 focus-visible:ring-offset-2 active:translate-y-px"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            {isPlayerOpen
              ? <path d="M6 6h12v12H6z" />
              : <path d="M8 5v14l11-7z" />}
          </svg>
          {isPlayerOpen ? t('lesson.hideVideo') : t('lesson.watchVideo')}
        </button>

        {isPlayerOpen && (
          <div id={playerId} className="aspect-video overflow-hidden rounded-2xl bg-soil-900 shadow-inner">
            <iframe
              className="h-full w-full"
              src={embedUrl}
              title={lesson.title}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </article>
  );
}
