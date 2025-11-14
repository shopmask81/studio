'use client';

// This file now re-exports from provider.tsx and client.ts
// The actual initialization logic has been moved to client.ts

export * from './provider';
export * from './client';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export * from './errors';
export * from './error-emitter';
