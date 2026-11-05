import { FirebaseError } from 'firebase/app';

/**
 * Plain-language message for a failed Firestore request.
 * `action` completes the sentence "We could not …", e.g. "load your farm profile".
 */
export function getFirestoreErrorMessage(error: unknown, action: string): string {
  const base = `We could not ${action}.`;

  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        return `${base} Firestore rejected the save. Publish the latest firestore.rules to your Firebase project, then try again.`;
      case 'failed-precondition':
        return `${base} The database is not ready yet. Please try again later.`;
      case 'unavailable':
      case 'network-request-failed':
        return `${base} Check your internet connection and try again.`;
    }
  }

  return `${base} Please try again.`;
}
