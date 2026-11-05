import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import type { FarmerProfile } from '../types/farmer';
import { getFirebaseDb } from './firebase';
import { getFirestoreErrorMessage } from './firestoreErrors';

export interface CreateFarmerProfileInput {
  uid: string;
  fullName: string;
  email: string;
}

export async function createFarmerProfile(input: CreateFarmerProfileInput): Promise<void> {
  const profileRef = doc(getFirebaseDb(), 'farmers', input.uid);
  await setDoc(profileRef, {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function getFarmerProfile(uid: string): Promise<FarmerProfile | null> {
  const profileSnapshot = await getDoc(doc(getFirebaseDb(), 'farmers', uid));
  if (!profileSnapshot.exists()) {
    return null;
  }

  const data = profileSnapshot.data();
  if (
    data.uid !== uid ||
    typeof data.fullName !== 'string' ||
    typeof data.email !== 'string' ||
    !(data.createdAt instanceof Timestamp)
  ) {
    throw new Error('The saved farmer profile has an invalid format.');
  }

  return {
    uid,
    fullName: data.fullName,
    email: data.email,
    createdAt: data.createdAt,
  };
}

export function getFarmerProfileErrorMessage(error: unknown): string {
  return getFirestoreErrorMessage(error, 'load your farmer profile');
}
