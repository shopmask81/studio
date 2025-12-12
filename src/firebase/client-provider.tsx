'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider, FirebaseContextState } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase/init';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // Initialize Firebase services once on the client side and memoize them.
  const firebaseServices = useMemo((): FirebaseContextState => {
    return initializeFirebase();
  }, []);

  return (
    <FirebaseProvider {...firebaseServices}>
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
}
