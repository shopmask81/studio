
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// This function ensures that Firebase is initialized only once.
function initializeFirebase() {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }
  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
}

// Call the initialization function
initializeFirebase();

// Export getter functions to access the initialized instances.
// This is safer than exporting the instances directly.
export function getFirebaseAppInstance(): FirebaseApp {
  if (!firebaseApp) initializeFirebase();
  return firebaseApp;
}

export function getAuthInstance(): Auth {
  if (!auth) initializeFirebase();
  return auth;
}

export function getFirestoreInstance(): Firestore {
  if (!firestore) initializeFirebase();
  return firestore;
}
