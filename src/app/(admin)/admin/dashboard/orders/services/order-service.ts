
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

type NewOrderData = Omit<Order, 'id' | 'createdAt'>;

/**
 * Fetches all orders from the 'orders' collection and updates the 
 * centralized cache document 'cachedData/allOrders'.
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

/**
 * Processes a new order by first adding it to the 'orders' collection,
 * and then immediately triggering a full refresh of the `cachedData/allOrders` document.
 * @param firestore The Firestore database instance.
 * @param orderData The data for the new order.
 * @returns The newly created order document reference ID.
 */
export async function processNewOrder(
  firestore: Firestore,
  orderData: NewOrderData
): Promise<string> {
  const collectionRef = collection(firestore, 'orders');
  
  try {
    // Step 1: Add the new order to the main collection.
    const newOrderRef = await addDoc(collectionRef, {
      ...orderData,
      createdAt: serverTimestamp(),
    });

    // Step 2: Immediately refresh the cache.
    // This is an asynchronous operation, but we don't need to wait for it
    // to complete before returning a response to the user.
    updateOrderCache(firestore).catch(cacheError => {
        // Log the error, but don't let it block the main flow.
        // The user's order is placed; the cache update is a background task.
        console.error("Background cache update failed after new order:", cacheError);
    });

    return newOrderRef.id;

  } catch (error) {
    if ((error as any).code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: collectionRef.path,
        operation: 'create',
        requestResourceData: orderData,
      }));
    }
    // Re-throw the error to be handled by the calling component (e.g., show a toast).
    throw error;
  }
}
