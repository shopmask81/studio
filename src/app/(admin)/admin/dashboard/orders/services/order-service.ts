import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  setDoc,
  Timestamp,
  orderBy,
  query
} from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Fetches all orders from the 'orders' collection and updates the 
 * centralized cache document 'cachedData/allOrders'.
 * This function should only be called from a context where the user
 * is authenticated as an admin.
 * @param firestore The Firestore database instance.
 * @returns The number of orders cached.
 */
export async function updateOrderCache(firestore: Firestore): Promise<number> {
  try {
    const ordersRef = collection(firestore, 'orders');
    // Fetch all orders, sort by date for consistency, though the client will re-sort.
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const allOrders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Ensure timestamps are serializable if they aren't already plain objects
      createdAt: (doc.data().createdAt as Timestamp)?.toDate ? (doc.data().createdAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
    })) as unknown as Order[];

    const cacheDocRef = doc(firestore, 'cachedData', 'allOrders');
    
    // Set the data, overwriting the document completely.
    await setDoc(cacheDocRef, {
      orders: allOrders,
      lastUpdated: serverTimestamp(),
    });

    return allOrders.length;
  } catch (error) {
    console.error("Error updating order cache:", error);
    if ((error as any).code === 'permission-denied') {
      const permissionError = new FirestorePermissionError({
        path: 'cachedData/allOrders',
        operation: 'write',
      });
      errorEmitter.emit('permission-error', permissionError);
      throw new Error('You do not have permission to update the order cache.');
    }
    throw error;
  }
}
