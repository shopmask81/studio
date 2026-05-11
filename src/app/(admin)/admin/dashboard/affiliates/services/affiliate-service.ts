
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
  writeBatch
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
        // Isolation: Temporary login MUST not touch LocalStorage
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
  
  const codeQuery = query(affiliatesRef, where('code', '==', values.code), limit(1));
  const codeSnap = await getDocs(codeQuery);
  if (!codeSnap.empty) {
      throw new Error('This affiliate code is already taken. Please choose another.');
  }

  // 3. Atomic Batch Write
  const batch = writeBatch(firestore);
  
  // Create Affiliate Document
  const affiliateRef = doc(collection(firestore, 'affiliates'));
  const affiliateData = {
    id: affiliateRef.id, // Explicitly set ID inside the data
    userId,
    name: values.name,
    email: values.email,
    code: values.code,
    commissionRate: values.commissionRate,
    status: 'active' as const,
    totalOrders: 0,
    totalEarnings: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  batch.set(affiliateRef, affiliateData);

  // Set or Update User Role
  const userDocRef = doc(firestore, 'users', userId);
  if (isNewUser) {
    batch.set(userDocRef, {
        id: userId,
        uid: userId,
        name: values.name,
        email: values.email,
        role: "affiliate",
        affiliateCode: values.code,
        createdAt: serverTimestamp(),
        emailVerified: false,
    });
  } else {
    batch.update(userDocRef, { 
        role: 'affiliate',
        affiliateCode: values.code,
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

export async function updateAffiliate(
  firestore: Firestore,
  id: string,
  values: Partial<Affiliate>
): Promise<void> {
  const affRef = doc(firestore, 'affiliates', id);
  const dataToUpdate = {
    ...values,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(affRef, dataToUpdate)
    .catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: affRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate
        }));
        throw err;
    });
  
  if (values.code && values.userId) {
      const userRef = doc(firestore, 'users', values.userId);
      await updateDoc(userRef, { 
          affiliateCode: values.code,
          updatedAt: serverTimestamp(),
      });
  }
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
      updatedAt: serverTimestamp(),
  });

  await batch.commit()
    .catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'affiliates/delete-batch',
            operation: 'write',
        }));
        throw err;
    });
}
