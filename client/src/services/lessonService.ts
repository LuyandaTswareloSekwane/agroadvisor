import { collection, getDocs, query, where } from 'firebase/firestore';
import { APP_LANGUAGES, type AppLanguage } from '../i18n';
import type {
  LessonIcon,
  LessonStep,
  LocalizedLessonSteps,
  StoredLesson,
  LocalizedLessonText,
  VideoLesson,
} from '../types/lesson';
import { getFirebaseDb } from './firebase';

const LESSONS_COLLECTION = 'lessons';
const LESSON_ICONS: readonly LessonIcon[] = ['sun', 'water', 'cover', 'soil', 'leaf', 'animal', 'fence', 'clock'];
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const TOPIC_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_LESSON_DURATION_SECONDS = 10 * 60;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && APP_LANGUAGES.some((language) => language === value);
}

function isLocalizedText(value: unknown, maxLength = 2000): value is LocalizedLessonText {
  return isRecord(value) && APP_LANGUAGES.every((language) =>
    typeof value[language] === 'string'
      && value[language].trim().length > 0
      && value[language].length <= maxLength,
  );
}

function getLocalizedText(value: unknown, maxLength: number): LocalizedLessonText | null {
  if (typeof value === 'string') {
    if (value.trim().length === 0 || value.length > maxLength) return null;
    return { en: value, af: value, zu: value, st: value, tn: value };
  }
  return isLocalizedText(value, maxLength) ? value : null;
}

function isLessonStep(value: unknown): value is LessonStep {
  return (
    isRecord(value)
    && typeof value.icon === 'string'
    && LESSON_ICONS.some((icon) => icon === value.icon)
    && typeof value.text === 'string'
    && value.text.trim().length > 0
    && value.text.length <= 240
  );
}

function isLessonStepList(value: unknown): value is LessonStep[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 8 && value.every(isLessonStep);
}

function getLocalizedSteps(value: unknown): LocalizedLessonSteps | null {
  if (isLessonStepList(value)) return { en: value, af: value, zu: value, st: value, tn: value };
  if (!isRecord(value)) return null;
  const { en, af, zu, st, tn } = value;
  if (!isLessonStepList(en) || !isLessonStepList(af) || !isLessonStepList(zu) || !isLessonStepList(st) || !isLessonStepList(tn)) {
    return null;
  }
  return { en, af, zu, st, tn };
}

function parseLesson(id: string, value: unknown): StoredLesson {
  if (!isRecord(value)) {
    throw new Error(`Published lesson "${id}" has an invalid document.`);
  }

  const {
    topicId,
    topicLabel,
    title,
    youtubeId,
    language,
    durationSeconds,
    sourceChannel,
    reviewed,
    published,
    visualOnly,
    fallbackPriority,
    summary,
    keySteps,
  } = value;
  const englishTopicLabel = getLocalizedText(topicLabel, 100);
  const englishTitle = getLocalizedText(title, 160);
  const englishSummary = getLocalizedText(summary, 500);
  const englishSteps = getLocalizedSteps(keySteps);

  if (
    typeof topicId !== 'string'
    || topicId.length > 60
    || !TOPIC_ID_PATTERN.test(topicId)
    || englishTopicLabel === null
    || englishTitle === null
    || typeof youtubeId !== 'string'
    || !YOUTUBE_ID_PATTERN.test(youtubeId)
    || !isAppLanguage(language)
    || typeof durationSeconds !== 'number'
    || !Number.isInteger(durationSeconds)
    || durationSeconds < 1
    || durationSeconds > MAX_LESSON_DURATION_SECONDS
    || typeof sourceChannel !== 'string'
    || sourceChannel.trim().length === 0
    || sourceChannel.length > 120
    || reviewed !== true
    || published !== true
    || typeof visualOnly !== 'boolean'
    || typeof fallbackPriority !== 'number'
    || !Number.isInteger(fallbackPriority)
    || fallbackPriority < 0
    || englishSummary === null
    || englishSteps === null
  ) {
    throw new Error(`Published lesson "${id}" is missing required curation fields.`);
  }

  return {
    id,
    topicId,
    topicLabel: englishTopicLabel,
    title: englishTitle,
    youtubeId,
    language,
    durationSeconds,
    sourceChannel: sourceChannel.trim(),
    reviewed: true,
    published: true,
    visualOnly,
    fallbackPriority,
    summary: englishSummary,
    keySteps: englishSteps,
  };
}

/** Loads only lessons that a curator has reviewed and published. */
export async function getPublishedLessons(): Promise<StoredLesson[]> {
  const lessonsQuery = query(
    collection(getFirebaseDb(), LESSONS_COLLECTION),
    where('reviewed', '==', true),
    where('published', '==', true),
  );
  const snapshot = await getDocs(lessonsQuery);
  return snapshot.docs.map((lesson) => parseLesson(lesson.id, lesson.data()));
}

/** Picks the text of one app language, so a lesson follows the language the farmer selected. */
export function localizeLesson(lesson: StoredLesson, language: AppLanguage): VideoLesson {
  return {
    ...lesson,
    topicLabel: lesson.topicLabel[language],
    title: lesson.title[language],
    summary: lesson.summary[language],
    keySteps: lesson.keySteps[language],
  };
}
