'use client';

import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { initializeFirebase } from './init';
import { FirebaseApp } from 'firebase/app';

let auth: Auth;
let firestore: Firestore;
let firebaseApp: FirebaseApp;

const services = initializeFirebase();
firebaseApp = services.firebaseApp;
auth = services.auth;
firestore = services.firestore;

export function getAuthInstance(): Auth {
  return auth;
}

export function getFirestoreInstance(): Firestore {
  return firestore;
}

export function getFirebaseAppInstance(): FirebaseApp {
    return firebaseApp;
}
