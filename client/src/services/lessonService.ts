import { collection, getDocs, query, where } from 'firebase/firestore';
import { APP_LANGUAGES, type AppLanguage } from '../i18n';
import type {
  LessonIcon,
  LessonStep,
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

function getEnglishText(value: unknown, maxLength: number): string | null {
  if (typeof value === 'string') {
    return value.trim().length > 0 && value.length <= maxLength ? value : null;
  }
  if (isLocalizedText(value, maxLength)) return value.en;
  return null;
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

function getEnglishSteps(value: unknown): LessonStep[] | null {
  if (isLessonStepList(value)) return value;
  if (!isRecord(value)) return null;
  const allLanguagesHaveSteps = APP_LANGUAGES.every((language) => isLessonStepList(value[language]));
  if (!allLanguagesHaveSteps || !isLessonStepList(value.en)) {
    return null;
  }
  return value.en;
}

function parseLesson(id: string, value: unknown): VideoLesson {
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
  const englishTopicLabel = getEnglishText(topicLabel, 100);
  const englishTitle = getEnglishText(title, 160);
  const englishSummary = getEnglishText(summary, 500);
  const englishSteps = getEnglishSteps(keySteps);

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
export async function getPublishedLessons(): Promise<VideoLesson[]> {
  const lessonsQuery = query(
    collection(getFirebaseDb(), LESSONS_COLLECTION),
    where('reviewed', '==', true),
    where('published', '==', true),
  );
  const snapshot = await getDocs(lessonsQuery);
  return snapshot.docs.map((lesson) => parseLesson(lesson.id, lesson.data()));
}
