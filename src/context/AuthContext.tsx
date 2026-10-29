import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  signInWithGoogle,
  signInWithGoogleRedirect,
  checkRedirectResult,
  logOut,
  subscribeToAuth,
  AuthUserProfile,
} from '../services/firebase';

interface AuthContextType {
  currentUser: AuthUserProfile | null;
  isAuthLoading: boolean;
  isLoggingIn: boolean;
  loginWithGoogle: () => Promise<AuthUserProfile | null>;
  loginWithGoogleRedirect: () => Promise<void>;
  logout: () => Promise<void>;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  setSyncStatus: (status: 'idle' | 'syncing' | 'synced' | 'error') => void;
  lastSyncedAt: string | null;
  setLastSyncedAt: (timestamp: string | null) => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    // Check if returning from a redirect OAuth flow
    checkRedirectResult()
      .then((profile) => {
        if (profile && isMounted) {
          setCurrentUser(profile);
        }
      })
      .catch((err) => {
        console.error('Redirect sign-in resolution notice:', err);
      });

    const unsubscribe = subscribeToAuth((user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      setIsLoggingIn(true);
      const profile = await signInWithGoogle();
      setCurrentUser(profile);
      setShowLoginModal(false);
      return profile;
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loginWithGoogleRedirect = async () => {
    try {
      setIsLoggingIn(true);
      await signInWithGoogleRedirect();
    } catch (error: any) {
      console.error('Google Redirect Sign-In error:', error);
      setIsLoggingIn(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logOut();
      setCurrentUser(null);
      setSyncStatus('idle');
    } catch (error) {
      console.error('Sign-Out failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthLoading,
        isLoggingIn,
        loginWithGoogle,
        loginWithGoogleRedirect,
        logout,
        syncStatus,
        setSyncStatus,
        lastSyncedAt,
        setLastSyncedAt,
        showLoginModal,
        setShowLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
