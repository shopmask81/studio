'use client';

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Firestore,
  DocumentData,
  WithFieldValue,
} from 'firebase/firestore';
import type { Banner } from '@/lib/types';

/**
 * Fetches all banners that are marked as 'active'.
 * This function is intended for public-facing parts of the site.
 * It now fetches all banners and filters on the client to avoid a composite index.
 * @param {Firestore} db - The Firestore database instance.
 * @returns {Promise<Banner[]>} A promise that resolves to an array of active banners.
 */
export async function getActiveBanners(db: Firestore): Promise<Banner[]> {
  const bannersRef = collection(db, 'banners');
  // Query only by order to avoid needing a composite index.
  const q = query(
    bannersRef,
    orderBy('order', 'asc')
  );

  const querySnapshot = await getDocs(q);
  
  // Map and then filter on the client side.
  const banners = querySnapshot.docs
    .map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }) as Banner)
    .filter((banner) => banner.active === true);

  return banners;
}

/**
 * Fetches all banners, regardless of their active status.
 * This function is intended for admin use.
 * @param {Firestore} db - The Firestore database instance.
 * @returns {Promise<Banner[]>} A promise that resolves to an array of all banners.
 */
export async function getAllBanners(db: Firestore): Promise<Banner[]> {
  const bannersRef = collection(db, 'banners');
  const q = query(bannersRef, orderBy('order', 'asc'));

  const querySnapshot = await getDocs(q);
  const banners = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Banner[];
  
  return banners;
}
