import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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
  }

  return userProfile;
}

/**
 * Sign out current user
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
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
    throw error;
  }
}

/**
 * Load user's complete workspace data from Firestore under their unique user ID
 */
export async function loadUserWorkspace(userId: string): Promise<Record<string, any> | null> {
  if (!userId) return null;
  try {
    const docRef = doc(db, 'users', userId, 'workspace', 'data');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (error) {
    console.error(`Failed to load workspace for user ${userId}:`, error);
    return null;
  }
}
