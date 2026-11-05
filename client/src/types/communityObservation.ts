import type { Timestamp } from 'firebase/firestore';
import type { Farm } from './farm';

export type CommunityObservationType = 'flooding' | 'frost' | 'other';

export interface CommunityObservation {
  id: string;
  type: CommunityObservationType;
  details: string;
  location: {
    latitude: number;
    longitude: number;
  };
  authorId: string;
  reportCount: number;
  createdAt: Timestamp;
}

export interface CommunityMapData {
  farm: Farm | null;
  observations: CommunityObservation[];
  hasMoreNearby: boolean;
}

export type CommunityReportResult = 'reported' | 'hidden' | 'already-reported';
