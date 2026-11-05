import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  onAuthStateChanged,
  OAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import type { AuthProviderName, AuthUser, LoginInput, RegisterInput } from '../types/auth';
import { FirebaseNotConfiguredError, getFirebaseAuth, isFirebaseConfigured } from './firebase';
import { createFarmerProfile } from './farmerService';

const MISSING_PROVIDER_EMAIL = 'The selected identity provider did not return an email address.';

function toAuthUser(user: User): AuthUser {
  return { uid: user.uid, email: user.email, displayName: user.displayName };
}

/** Calls `callback` with the current farmer now and whenever they sign in or out. */
export function subscribeToAuthChanges(callback: (user: AuthUser | null) => void): Unsubscribe {
  if (!isFirebaseConfigured) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(getFirebaseAuth(), (user) => callback(user ? toAuthUser(user) : null));
}

export async function registerFarmer({ fullName, email, password }: RegisterInput): Promise<AuthUser> {
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  await updateProfile(credential.user, { displayName: fullName });
  if (!credential.user.email) {
    throw new Error('Firebase did not return an email address for the new farmer account.');
  }
  await createFarmerProfile({
    uid: credential.user.uid,
    fullName,
    email: credential.user.email,
  });
  return toAuthUser(credential.user);
}

export async function loginFarmer({ email, password }: LoginInput): Promise<AuthUser> {
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return toAuthUser(credential.user);
}

export async function loginFarmerWithProvider(providerName: AuthProviderName): Promise<AuthUser> {
  const provider = providerName === 'google'
    ? new GoogleAuthProvider()
    : new OAuthProvider('microsoft.com');
  if (provider instanceof OAuthProvider) {
    provider.addScope('email');
    provider.addScope('User.Read');
  }
  provider.setCustomParameters({ prompt: 'select_account' });

  const credential = await signInWithPopup(getFirebaseAuth(), provider);
  const email = credential.user.email;
  if (!email) {
    throw new Error(MISSING_PROVIDER_EMAIL);
  }

  if (getAdditionalUserInfo(credential)?.isNewUser) {
    const fullName = credential.user.displayName?.trim() || email.split('@')[0] || email;
    await createFarmerProfile({ uid: credential.user.uid, fullName, email });
  }
  return toAuthUser(credential.user);
}

export async function logoutFarmer(): Promise<void> {
  await signOut(getFirebaseAuth());
}

/** Firebase Auth error codes mapped to plain-language messages for farmers. */
const authErrorMessages: Record<string, string> = {
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/wrong-password': 'The email or password is incorrect.',
  'auth/user-not-found': 'The email or password is incorrect.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
  'auth/weak-password': 'Please choose a stronger password.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'No internet connection. Check your connection and try again.',
  'auth/operation-not-allowed': 'This sign-in option is not enabled for AgroAdvisor yet. Enable it in Firebase Authentication settings.',
  'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.',
  'auth/popup-closed-by-user': 'The sign-in window was closed before finishing.',
  'auth/unauthorized-domain': 'This website is not authorized for Firebase sign-in. Add its domain in Firebase Authentication settings.',
  'auth/account-exists-with-different-credential': 'This email already uses another sign-in method. Log in using that method first.',
  'permission-denied': 'Your account was created, but your farmer profile could not be saved. Check the Firestore security rules, then log in again.',
  'failed-precondition': 'Your account was created, but your farmer profile could not be saved. Create the Firestore database and publish its security rules, then log in again.',
  unavailable: 'Your account was created, but your farmer profile could not be saved. Check your internet connection, then log in again.',
};

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseNotConfiguredError) {
    return 'Sign-in is not available yet because Firebase has not been set up.';
  }
  if (error instanceof Error && error.message === MISSING_PROVIDER_EMAIL) {
    return 'This account did not share an email address. Choose an account with an email address to create your farmer profile.';
  }
  if (error instanceof FirebaseError) {
    return authErrorMessages[error.code] ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
