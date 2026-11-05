import type { DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';

export const FARM_MEMORY_TYPES = ['weather', 'planting', 'success', 'lesson'] as const;

export type FarmMemoryType = (typeof FARM_MEMORY_TYPES)[number];
export type FarmMemoryLogType = Exclude<FarmMemoryType, 'lesson'>;

export interface FarmMemoryEntry {
  id: string;
  type: FarmMemoryType;
  title: string;
  note: string;
  occurredAt: Timestamp;
  createdAt: Timestamp;
  lessonId?: string;
}

export interface FarmMemorySnapshot {
  recentEntries: FarmMemoryEntry[];
  weekEntries: FarmMemoryEntry[];
  recentCursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMoreRecent: boolean;
}

export interface FarmMemoryInput {
  type: FarmMemoryLogType;
  title: string;
  note: string;
  occurredOn: string;
}
