import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('email');
googleAuthProvider.addScope('profile');
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore (targeting configured database)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection test on boot as per guidelines
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is running in offline mode.');
    }
  }
}
testFirestoreConnection();

export interface AuthUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Sign in using Google OAuth Popup
 */
export async function signInWithGoogle(): Promise<AuthUserProfile> {
  const result = await signInWithPopup(auth, googleAuthProvider);
  const user = result.user;
  const userProfile: AuthUserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };

  // Sync user profile record
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        ...userProfile,
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving user profile to Firestore:', err);
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }

  return userProfile;
}

/**
 * Sign in using Google OAuth Redirect (fallback when popups are blocked)
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  await signInWithRedirect(auth, googleAuthProvider);
}

/**
 * Check and resolve any pending redirect sign-in result on page load
 */
export async function checkRedirectResult(): Promise<AuthUserProfile | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const user = result.user;
      const userProfile: AuthUserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };

      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            ...userProfile,
            lastLoginAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Error saving user profile to Firestore:', err);
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }

      return userProfile;
    }
    return null;
  } catch (err) {
    console.error('Error checking redirect result:', err);
    throw err;
  }
}

/**
 * Sign out current user
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Subscribe to Auth State Changes
 */
export function subscribeToAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Save user's complete workspace data under their unique user ID in Firestore
 */
export async function saveUserWorkspace(userId: string, data: Record<string, any>) {
  if (!userId) return;
  // Local mode bypass
  if (userId.startsWith('local-user-') || !auth.currentUser) {
    return;
  }
  try {
    const docRef = doc(db, 'users', userId, 'workspace', 'data');
    await setDoc(
      docRef,
      {
        userId,
        updatedAt: new Date().toISOString(),
        ...data,
      },
      { merge: true }
    );
  } catch (error) {
    console.error(`Failed to save workspace for user ${userId}:`, error);
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/workspace/data`);
  }
}

/**
 * Load user's complete workspace data from Firestore under their unique user ID
 */
export async function loadUserWorkspace(userId: string): Promise<Record<string, any> | null> {
  if (!userId) return null;
  // Local mode bypass
  if (userId.startsWith('local-user-') || !auth.currentUser) {
    return null;
  }
  try {
    const docRef = doc(db, 'users', userId, 'workspace', 'data');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (error) {
    console.error(`Failed to load workspace for user ${userId}:`, error);
    handleFirestoreError(error, OperationType.GET, `users/${userId}/workspace/data`);
    return null;
  }
}
