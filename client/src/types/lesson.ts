import type { AppLanguage } from '../i18n';

export type LessonIcon = 'sun' | 'water' | 'cover' | 'soil' | 'leaf' | 'animal' | 'fence' | 'clock';

export type LocalizedLessonText = Record<AppLanguage, string>;

export interface LessonStep {
  icon: LessonIcon;
  text: string;
}

export type LocalizedLessonSteps = Record<AppLanguage, LessonStep[]>;

/** A lesson as stored: text fields carry every app language (a plain string is used for all). */
export interface StoredLesson extends Omit<VideoLesson, 'topicLabel' | 'title' | 'summary' | 'keySteps'> {
  topicLabel: LocalizedLessonText;
  title: LocalizedLessonText;
  summary: LocalizedLessonText;
  keySteps: LocalizedLessonSteps;
}

/** Curated Firestore lesson shown only after both reviewed and published are true. */
export interface VideoLesson {
  id: string;
  topicId: string;
  topicLabel: string;
  title: string;
  youtubeId: string;
  language: AppLanguage;
  durationSeconds: number;
  sourceChannel: string;
  // NEEDS VERIFICATION: the curator must verify the video and every localized instruction before publishing.
  reviewed: true;
  published: true;
  visualOnly: boolean;
  fallbackPriority: number;
  summary: string;
  keySteps: LessonStep[];
}
