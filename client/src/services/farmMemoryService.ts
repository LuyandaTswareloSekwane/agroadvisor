import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import {
  FARM_MEMORY_TYPES,
  type FarmMemoryEntry,
  type FarmMemoryInput,
  type FarmMemorySnapshot,
} from '../types/farmMemory';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { getFirestoreErrorMessage } from './firestoreErrors';

const FARMS_COLLECTION = 'farms';
const MEMORY_COLLECTION = 'memory';
const RECENT_ENTRY_LIMIT = 30;
const WEEK_ENTRY_LIMIT = 100;

export interface FarmMemoryPage {
  entries: FarmMemoryEntry[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export class FarmMemoryValidationError extends Error {
  constructor() {
    super('The farm memory entry is invalid.');
    this.name = 'FarmMemoryValidationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFarmMemoryType(value: unknown): value is FarmMemoryEntry['type'] {
  return typeof value === 'string' && FARM_MEMORY_TYPES.some((type) => type === value);
}

function parseEntry(id: string, value: unknown): FarmMemoryEntry {
  const lessonId = isRecord(value) && typeof value.lessonId === 'string' ? value.lessonId : undefined;
  if (
    !isRecord(value)
    || !isFarmMemoryType(value.type)
    || typeof value.title !== 'string'
    || value.title.trim().length === 0
    || value.title.length > 160
    || typeof value.note !== 'string'
    || value.note.length > 500
    || !(value.occurredAt instanceof Timestamp)
    || !(value.createdAt instanceof Timestamp)
    || (value.type === 'lesson'
      ? lessonId === undefined || lessonId.length === 0 || lessonId.length > 200
      : value.lessonId !== undefined)
  ) {
    throw new Error('A saved farm memory entry has an invalid format.');
  }

  return {
    id,
    type: value.type,
    title: value.title,
    note: value.note,
    occurredAt: value.occurredAt,
    createdAt: value.createdAt,
    ...(value.type === 'lesson' && lessonId !== undefined ? { lessonId } : {}),
  };
}

function localWeekStart(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function parseLocalDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new FarmMemoryValidationError();

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);
  const isSameDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  if (!isSameDate || value > todayKey) throw new FarmMemoryValidationError();
  return date;
}

function memoryCollection(ownerId: string) {
  return collection(getFirebaseDb(), FARMS_COLLECTION, ownerId, MEMORY_COLLECTION);
}

async function getRecentMemoryPage(
  ownerId: string,
  cursor: QueryDocumentSnapshot<DocumentData> | null = null,
): Promise<FarmMemoryPage> {
  const entries = memoryCollection(ownerId);
  const recentQuery = cursor
    ? query(entries, orderBy('occurredAt', 'desc'), startAfter(cursor), limit(RECENT_ENTRY_LIMIT + 1))
    : query(entries, orderBy('occurredAt', 'desc'), limit(RECENT_ENTRY_LIMIT + 1));
  const snapshot = await getDocs(recentQuery);
  const visibleDocs = snapshot.docs.slice(0, RECENT_ENTRY_LIMIT);
  return {
    entries: visibleDocs.map((entry) => parseEntry(entry.id, entry.data())),
    cursor: visibleDocs[visibleDocs.length - 1] ?? null,
    hasMore: snapshot.docs.length > RECENT_ENTRY_LIMIT,
  };
}

/** Loads a bounded recent history and this local calendar week's records. */
export async function getFarmMemory(ownerId: string): Promise<FarmMemorySnapshot> {
  const start = localWeekStart(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const entries = memoryCollection(ownerId);
  const [recentPage, weekSnapshot] = await Promise.all([
    getRecentMemoryPage(ownerId),
    getDocs(query(
      entries,
      where('occurredAt', '>=', Timestamp.fromDate(start)),
      where('occurredAt', '<', Timestamp.fromDate(end)),
      orderBy('occurredAt', 'desc'),
      limit(WEEK_ENTRY_LIMIT),
    )),
  ]);

  return {
    recentEntries: recentPage.entries,
    weekEntries: weekSnapshot.docs.map((entry) => parseEntry(entry.id, entry.data())),
    recentCursor: recentPage.cursor,
    hasMoreRecent: recentPage.hasMore,
  };
}

export async function getMoreFarmMemory(
  ownerId: string,
  cursor: QueryDocumentSnapshot<DocumentData>,
): Promise<FarmMemoryPage> {
  return getRecentMemoryPage(ownerId, cursor);
}

/** Returns the lesson IDs already completed for this farmer's farm. */
export async function getCompletedFarmLessonIds(ownerId: string): Promise<Set<string>> {
  const lessonQuery = query(memoryCollection(ownerId), where('type', '==', 'lesson'));
  const snapshot = await getDocs(lessonQuery);
  return new Set(snapshot.docs.map((entry) => {
    const parsed = parseEntry(entry.id, entry.data());
    if (!parsed.lessonId) throw new Error('A completed lesson record is missing its lesson ID.');
    return parsed.lessonId;
  }));
}

export async function addFarmMemoryEntry(ownerId: string, input: FarmMemoryInput): Promise<void> {
  const title = input.title.trim();
  const note = input.note.trim();
  if (
    !['weather', 'planting', 'success'].includes(input.type)
    || title.length === 0
    || title.length > 120
    || note.length > 500
  ) {
    throw new FarmMemoryValidationError();
  }

  const occurredAt = Timestamp.fromDate(parseLocalDate(input.occurredOn));
  await setDoc(doc(memoryCollection(ownerId)), {
    type: input.type,
    title,
    note,
    occurredAt,
    createdAt: serverTimestamp(),
  });
}

/** Writes a completion only once, so revisiting a lesson cannot create duplicate memories. */
export async function completeFarmLesson(ownerId: string, lessonId: string, title: string): Promise<void> {
  const normalizedTitle = title.trim();
  const encodedId = encodeURIComponent(lessonId);
  if (
    lessonId.trim().length === 0
    || lessonId.length > 200
    || encodedId.length > 500
    || normalizedTitle.length === 0
    || normalizedTitle.length > 160
  ) {
    throw new FarmMemoryValidationError();
  }

  const completionRef = doc(memoryCollection(ownerId), `lesson-${encodedId}`);
  await runTransaction(getFirebaseDb(), async (transaction) => {
    const existing = await transaction.get(completionRef);
    if (existing.exists()) return;

    transaction.set(completionRef, {
      type: 'lesson',
      title: normalizedTitle,
      note: '',
      lessonId,
      occurredAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  });
}

export async function deleteFarmMemoryEntry(ownerId: string, entryId: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), FARMS_COLLECTION, ownerId, MEMORY_COLLECTION, entryId));
}

export function getFarmMemoryErrorMessage(error: unknown, action: string): string {
  return getFirestoreErrorMessage(error, action);
}
