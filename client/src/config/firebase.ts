import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const PLACEHOLDER_PREFIX = 'your-';

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.trim() !== '' && !value.startsWith(PLACEHOLDER_PREFIX),
);

export class FirebaseNotConfiguredError extends Error {
  constructor() {
    super('Firebase is not configured. Add your Firebase web app values to client/.env.');
    this.name = 'FirebaseNotConfiguredError';
  }
}

const firebaseApp = isFirebaseConfigured
  ? getApps().find((existingApp) => existingApp.name === '[DEFAULT]') ?? initializeApp(firebaseConfig)
  : null;

const useEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
const emulatorHost = '127.0.0.1';

export const auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;
export const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;

if (useEmulators && auth && db) {
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, emulatorHost, 8080);
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    throw new FirebaseNotConfiguredError();
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    throw new FirebaseNotConfiguredError();
  }
  return db;
}
