'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';

interface FirebaseProviderProps extends FirebaseContextState {
  children: ReactNode;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services.
 * It now receives the initialized services as props.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  firebaseApp,
  firestore,
  auth,
  children,
}) => {
  // Memoize the context value based on the passed-in services
  const contextValue = useMemo((): FirebaseContextState => {
    return {
      firebaseApp,
      firestore,
      auth,
    };
  }, [firebaseApp, firestore, auth]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

function useFirebaseCore() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebaseCore must be used within a FirebaseProvider.');
  }
  return context;
}


/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebaseCore();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebaseCore();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebaseCore();
  return firebaseApp;
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(factory, deps);
}
