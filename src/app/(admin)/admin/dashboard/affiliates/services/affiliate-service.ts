
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
  query,
  where,
  limit,
  writeBatch
} from 'firebase/firestore';
import type { Affiliate, UserProfile } from '@/lib/types';

export async function addAffiliate(
  firestore: Firestore,
  values: { name: string; email: string; code: string; commissionRate: number }
): Promise<void> {
  // 1. Check if a user with this email exists
  const usersRef = collection(firestore, 'users');
  const userQuery = query(usersRef, where('email', '==', values.email), limit(1));
  const userSnap = await getDocs(userQuery);

  if (userSnap.empty) {
    throw new Error(`No user found with email ${values.email}. The user must create an account first.`);
  }

  const userDoc = userSnap.docs[0];
  const userId = userDoc.id;

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
  
  // If code changed, update user doc too
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
  
  // 1. Delete affiliate document
  const affRef = doc(firestore, 'affiliates', affiliate.id);
  batch.delete(affRef);

  // 2. Revert user role to customer
  const userRef = doc(firestore, 'users', affiliate.userId);
  batch.update(userRef, { 
      role: 'customer',
      affiliateCode: null
  });

  await batch.commit();
}
