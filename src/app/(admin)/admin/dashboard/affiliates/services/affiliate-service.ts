
import {
  Firestore,
  collection,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  query,
  where,
  limit,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import type { Affiliate } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export async function addAffiliate(
  firestore: Firestore,
  values: { name: string; email: string; code: string; commissionRate: number; password?: string }
): Promise<void> {
  const normalizedCode = values.code.toUpperCase().trim();
  const usersRef = collection(firestore, 'users');
  const userQuery = query(usersRef, where('email', '==', values.email), limit(1));
  const userSnap = await getDocs(userQuery);

  let userId: string;
  let isNewUser = false;

  // 1. Handle user account creation if it doesn't exist
  if (userSnap.empty) {
    if (!values.password) {
      throw new Error(`No user found with email ${values.email}. Please provide a password to create a new account.`);
    }

    isNewUser = true;
    const tempAppName = `temp-auth-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
        await setPersistence(tempAuth, inMemoryPersistence);
        const userCredential = await createUserWithEmailAndPassword(tempAuth, values.email, values.password);
        userId = userCredential.user.uid;
        await signOut(tempAuth);
        await deleteApp(tempApp);
    } catch (authError: any) {
        if (tempApp) await deleteApp(tempApp);
        throw authError;
    }
  } else {
    const userDoc = userSnap.docs[0];
    userId = userDoc.id;
  }

  // 2. Uniqueness Checks
  const affiliatesRef = collection(firestore, 'affiliates');
  const affQuery = query(affiliatesRef, where('userId', '==', userId), limit(1));
  const affSnap = await getDocs(affQuery);

  if (!affSnap.empty) {
    throw new Error('This user is already registered as an affiliate.');
  }
  
  const codeQuery = query(affiliatesRef, where('code', '==', normalizedCode), limit(1));
  const codeSnap = await getDocs(codeQuery);
  if (!codeSnap.empty) {
      throw new Error('This affiliate code is already taken. Please choose another.');
  }

  // 3. Atomic Batch Write
  const batch = writeBatch(firestore);
  
  const affiliateRef = doc(collection(firestore, 'affiliates'));
  const affiliateData = {
    id: affiliateRef.id,
    userId,
    name: values.name,
    email: values.email,
    code: normalizedCode,
    commissionRate: values.commissionRate,
    status: 'active' as const,
    totalOrders: 0,
    totalEarnings: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  batch.set(affiliateRef, affiliateData);

  const userDocRef = doc(firestore, 'users', userId);
  if (isNewUser) {
    batch.set(userDocRef, {
        id: userId,
        uid: userId,
        name: values.name,
        email: values.email,
        role: "affiliate",
        affiliateCode: normalizedCode,
        affiliateId: affiliateRef.id, 
        createdAt: serverTimestamp(),
        emailVerified: false,
    });
  } else {
    batch.update(userDocRef, { 
        role: 'affiliate',
        affiliateCode: normalizedCode,
        affiliateId: affiliateRef.id,
        updatedAt: serverTimestamp(),
    });
  }

  await batch.commit()
    .catch((err) => {
        console.error("Affiliate Batch Write Failed:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'affiliates/creation-batch',
            operation: 'write',
        }));
        throw err;
    });
}

/**
 * Updates an affiliate record and synchronizes the changes to the 
 * private cache document used by the affiliate dashboard.
 */
export async function updateAffiliate(
  firestore: Firestore,
  id: string,
  values: Partial<Affiliate>
): Promise<void> {
  const affRef = doc(firestore, 'affiliates', id);
  
  // 1. Fetch current affiliate data to get the userId for cache synchronization
  const affSnap = await getDoc(affRef);
  if (!affSnap.exists()) throw new Error('Affiliate record not found.');
  const currentData = affSnap.data() as Affiliate;
  const userId = currentData.userId;

  const dataToUpdate = {
    ...values,
    updatedAt: serverTimestamp(),
  };
  
  if (values.code) {
      dataToUpdate.code = values.code.toUpperCase().trim();
  }

  // 2. Perform updates using a batch to ensure collection and user profile stay in sync
  const batch = writeBatch(firestore);
  batch.update(affRef, dataToUpdate);

  if (values.code || values.commissionRate || values.status) {
      const userRef = doc(firestore, 'users', userId);
      const userUpdate: any = { updatedAt: serverTimestamp() };
      if (values.code) userUpdate.affiliateCode = values.code.toUpperCase().trim();
      batch.update(userRef, userUpdate);

      // 3. CRITICAL FIX: Synchronize to the affiliate's private stats cache document
      // This ensures the dashboard UI updates immediately when admin changes settings.
      const statsCacheRef = doc(firestore, 'cachedData', `affiliate_stats_${userId}`);
      
      // We perform a partial update on the cache document if it exists
      const statsSnap = await getDoc(statsCacheRef);
      if (statsSnap.exists()) {
          const cacheUpdate: any = { lastUpdated: serverTimestamp() };
          if (values.commissionRate !== undefined) cacheUpdate.commissionRate = values.commissionRate;
          if (values.status !== undefined) cacheUpdate.status = values.status;
          batch.update(statsCacheRef, cacheUpdate);
      }
  }

  await batch.commit()
    .catch((err) => {
        console.error("Affiliate Update Failed:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: affRef.path,
            operation: 'update',
        }));
        throw err;
    });
}

export async function deleteAffiliate(
  firestore: Firestore,
  affiliate: Affiliate
): Promise<void> {
  const batch = writeBatch(firestore);
  const affRef = doc(firestore, 'affiliates', affiliate.id);
  batch.delete(affRef);

  const userRef = doc(firestore, 'users', affiliate.userId);
  batch.update(userRef, { 
      role: 'customer' as const,
      affiliateCode: null,
      affiliateId: null,
      updatedAt: serverTimestamp(),
  });

  // Also clean up cache documents
  const statsCacheRef = doc(firestore, 'cachedData', `affiliate_stats_${affiliate.userId}`);
  const ordersCacheRef = doc(firestore, 'cachedData', `affiliate_orders_${affiliate.userId}`);
  batch.delete(statsCacheRef);
  batch.delete(ordersCacheRef);

  await batch.commit()
    .catch((err) => {
        console.error("Affiliate Delete Batch Failed:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'affiliates/delete-batch',
            operation: 'write',
        }));
        throw err;
    });
}
