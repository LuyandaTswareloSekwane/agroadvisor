import type { Timestamp } from 'firebase/firestore';

/** A farmer's private profile stored at `farmers/{uid}` in Cloud Firestore. */
export interface FarmerProfile {
  uid: string;
  fullName: string;
  email: string;
  createdAt: Timestamp;
}
