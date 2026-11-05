import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { VideoLessonCard } from '../components/lessons/VideoLessonCard';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/PageLoader';
import { useAuth } from '../hooks/useAuth';
import { useAsyncData } from '../hooks/useAsyncData';
import { useLanguage } from '../hooks/useLanguage';
import { completeFarmLesson, getCompletedFarmLessonIds, getFarmMemoryErrorMessage } from '../services/farmMemoryService';
import { getFirestoreErrorMessage } from '../services/firestoreErrors';
import { getFarm, getFarmLoadErrorMessage } from '../services/farmService';
import { getPublishedLessons } from '../services/lessonService';
import type { VideoLesson } from '../types/lesson';

interface LessonTopic {
  id: string;
  label: string;
  lessons: VideoLesson[];
}

export function LessonsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const ownerId = user?.uid ?? null;
  const lessonsState = useAsyncData('published-lessons', getPublishedLessons);
  const farmState = useAsyncData(ownerId, getFarm);
  const completions = useAsyncData(ownerId, getCompletedFarmLessonIds);
  const [completingLessonId, setCompletingLessonId] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const topics = useMemo<LessonTopic[]>(() => {
    if (!lessonsState.data) return [];
    const grouped = new Map<string, VideoLesson[]>();
    for (const lesson of lessonsState.data) {
      const current = grouped.get(lesson.topicId) ?? [];
      current.push(lesson);
      grouped.set(lesson.topicId, current);
    }

    return Array.from(grouped, ([id, lessons]) => ({
      id,
      label: lessons[0]?.topicLabel ?? id,
      lessons,
    })).sort((first, second) => first.label.localeCompare(second.label, 'en-ZA'));
  }, [lessonsState.data]);
  const completedLessonIds = useMemo(
    () => new Set(completions.data ?? []),
    [completions.data],
  );

  async function handleComplete(lesson: VideoLesson) {
    if (!ownerId || !farmState.data) return;
    setCompletingLessonId(lesson.id);
    setCompletionError(null);
    try {
      await completeFarmLesson(ownerId, lesson.id, lesson.title);
      completions.reload();
    } catch (error: unknown) {
      setCompletionError(getFarmMemoryErrorMessage(error, 'save lesson completion'));
    } finally {
      setCompletingLessonId(null);
    }
  }

  if (lessonsState.isLoading) return <PageLoader label={t('lesson.title')} />;

  if (lessonsState.error !== null) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert tone="error">{getFirestoreErrorMessage(lessonsState.error, 'load video lessons')}</Alert>
        <Button variant="secondary" onClick={lessonsState.reload}>
          {t('weather.tryAgain')}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-leaf-900 via-leaf-800 to-emerald-500 px-5 py-7 text-white shadow-xl shadow-leaf-900/15 sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-10 -top-20 -z-10 h-64 w-64 rounded-full bg-citrus-300/25 blur-3xl" aria-hidden="true" />
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/95 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-citrus-300" fill="none" aria-hidden="true">
              <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5v-17Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M5 5h12M9 8h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {t('lesson.path')}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{t('lesson.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">{t('lesson.intro')}</p>
        </div>
      </header>

      {farmState.error !== null && <Alert tone="error">{getFarmLoadErrorMessage(farmState.error)}</Alert>}
      {completions.error !== null && (
        <Alert tone="error">
          {t('lesson.completionLoadError')} {getFarmMemoryErrorMessage(completions.error, 'load lesson completion status')}
        </Alert>
      )}
      {!farmState.isLoading && farmState.error === null && !farmState.data && (
        <Alert tone="info">
          {t('lesson.completeUnavailable')}{' '}
          <Link to="/farm" className="font-bold underline underline-offset-2">{t('lesson.completeSetupLink')}</Link>
        </Alert>
      )}
      {completionError && <Alert tone="error">{completionError}</Alert>}

      {topics.length === 0 ? (
        <div className="rounded-3xl border border-leaf-100 bg-gradient-to-br from-white via-leaf-50/70 to-wheat-50/80 p-6 text-center shadow-sm sm:p-9">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-leaf-100 to-wheat-100 text-leaf-800 shadow-sm">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 19V5a2 2 0 0 1 2-2h14v18H6a2 2 0 0 1-2-2Zm0 0a2 2 0 0 1 2-2h14M9 8h7m-7 4h7" />
            </svg>
          </span>
          <h2 className="mt-4 text-lg font-extrabold text-leaf-900">{t('lesson.emptyTitle')}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-soil-600">{t('lesson.emptyText')}</p>
        </div>
      ) : (
        <div className="space-y-7">
          {topics.map((topic) => {
            return (
              <section key={topic.id} aria-labelledby={`topic-${topic.id}`}>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <h2 id={`topic-${topic.id}`} className="text-xl font-extrabold tracking-tight text-leaf-900">
                    {topic.label}
                  </h2>
                </div>
                {topic.lessons.length > 0 ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {topic.lessons.map((lesson) => (
                      <VideoLessonCard
                        key={lesson.id}
                        lesson={lesson}
                        completionStatus={
                          completions.isLoading || completions.error !== null || !farmState.data
                            ? null
                            : completedLessonIds.has(lesson.id) ? 'completed' : 'available'
                        }
                        isCompleting={completingLessonId === lesson.id}
                        isCompletionPending={completingLessonId !== null}
                        onComplete={() => void handleComplete(lesson)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-soil-100 bg-white/80 p-4 text-sm leading-6 text-soil-600">
                    {t('lesson.noVisualFallback')}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
