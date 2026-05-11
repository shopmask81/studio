
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
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import type { Affiliate } from '@/lib/types';

export async function addAffiliate(
  firestore: Firestore,
  values: { name: string; email: string; code: string; commissionRate: number; password?: string }
): Promise<void> {
  const usersRef = collection(firestore, 'users');
  const userQuery = query(usersRef, where('email', '==', values.email), limit(1));
  const userSnap = await getDocs(userQuery);

  let userId: string;

  // 1. If user doesn't exist and password is provided, create a new user account
  if (userSnap.empty) {
    if (!values.password) {
      throw new Error(`No user found with email ${values.email}. Please provide a password to create a new account.`);
    }

    // Use a secondary Firebase app instance to create the user without signing out the admin
    const tempAppName = `temp-auth-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
        const userCredential = await createUserWithEmailAndPassword(tempAuth, values.email, values.password);
        userId = userCredential.user.uid;
        
        // Sign out from the temp app immediately
        await signOut(tempAuth);
        await deleteApp(tempApp);
        
        // Initialize the user document in Firestore (normally done during signup)
        const userDocRef = doc(firestore, 'users', userId);
        await writeBatch(firestore).set(userDocRef, {
            uid: userId,
            name: values.name,
            email: values.email,
            role: "affiliate",
            affiliateCode: values.code,
            createdAt: serverTimestamp(),
            emailVerified: false,
        }).commit();

    } catch (authError: any) {
        await deleteApp(tempApp);
        throw new Error(`Failed to create account: ${authError.message}`);
    }
  } else {
    const userDoc = userSnap.docs[0];
    userId = userDoc.id;
  }

  // 2. Check if this user is already an affiliate
  const affiliatesRef = collection(firestore, 'affiliates');
  const affQuery = query(affiliatesRef, where('userId', '==', userId), limit(1));
  const affSnap = await getDocs(affQuery);

  if (!affSnap.empty) {
    throw new Error('This user is already registered as an affiliate.');
  }
  
  // 3. Check if the code is unique
  const codeQuery = query(affiliatesRef, where('code', '==', values.code), limit(1));
  const codeSnap = await getDocs(codeQuery);
  if (!codeSnap.empty) {
      throw new Error('This affiliate code is already taken. Please choose another.');
  }

  // 4. Update the user role and add the affiliate document
  const batch = writeBatch(firestore);
  
  const affiliateRef = doc(affiliatesRef);
  batch.set(affiliateRef, {
    userId,
    name: values.name,
    email: values.email,
    code: values.code,
    commissionRate: values.commissionRate,
    status: 'active',
    totalOrders: 0,
    totalEarnings: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const userRef = doc(firestore, 'users', userId);
  batch.update(userRef, { 
      role: 'affiliate',
      affiliateCode: values.code
  });

  await batch.commit();
}

export async function updateAffiliate(
  firestore: Firestore,
  id: string,
  values: Partial<Affiliate>
): Promise<void> {
  const affRef = doc(firestore, 'affiliates', id);
  await updateDoc(affRef, {
    ...values,
    updatedAt: serverTimestamp(),
  });
  
  if (values.code && values.userId) {
      const userRef = doc(firestore, 'users', values.userId);
      await updateDoc(userRef, { affiliateCode: values.code });
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
      role: 'customer',
      affiliateCode: null
  });

  await batch.commit();
}
