
'use client';

import {
  collection,
  getDocs,
  query,
  orderBy,
  Firestore,
  getDoc,
  doc
} from 'firebase/firestore';
import type { Banner } from '@/lib/types';

type CachedBannerData = {
  banners: Banner[];
  updatedAt: any;
}

/**
 * Fetches active banners from the public cache document in Firestore.
 * This is the primary method for public-facing parts of the site.
 * @param {Firestore} db - The Firestore database instance.
 * @returns {Promise<Banner[]>} A promise that resolves to an array of active banners.
 */
export async function getActiveBanners(db: Firestore): Promise<Banner[]> {
  const cacheRef = doc(db, 'cachedData', 'allBanners');
  const docSnap = await getDoc(cacheRef);

  if (!docSnap.exists()) {
    console.warn("Banner cache document 'cachedData/allBanners' not found.");
    return [];
  }

  const data = docSnap.data() as CachedBannerData;
  const allCachedBanners = data.banners || [];

  // Filter for active banners and sort them on the client side
  const activeBanners = allCachedBanners
    .filter(banner => banner.active)
    .sort((a, b) => a.order - b.order);
    
  return activeBanners;
}

/**
 * Fetches ALL banners directly from the 'banners' collection.
 * This function is intended for admin use only and requires admin permissions.
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
