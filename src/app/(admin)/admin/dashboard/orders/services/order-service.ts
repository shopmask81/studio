
import {
  Firestore,
  collection,
  serverTimestamp,
  getDocs,
  doc,
  writeBatch,
  Timestamp,
  orderBy,
  query
} from 'firebase/firestore';
import type { Order, Affiliate } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Fetches all orders from the 'orders' collection and updates:
 * 1. The centralized admin cache 'cachedData/allOrders'.
 * 2. Individual affiliate caches 'cachedData/affiliate_orders_{userId}'.
 * 3. Individual affiliate stats 'cachedData/affiliate_stats_{userId}'.
 * 
 * @param firestore The Firestore database instance.
 * @returns The number of orders cached in the main admin document.
 */
export async function updateOrderCache(firestore: Firestore): Promise<number> {
  try {
    const batch = writeBatch(firestore);

    // 1. Fetch all orders
    const ordersRef = collection(firestore, 'orders');
    const qOrders = query(ordersRef, orderBy('createdAt', 'desc'));
    const orderSnapshot = await getDocs(qOrders);

    const allOrders = orderSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate ? (doc.data().createdAt as Timestamp).toDate().toISOString() : new Date(doc.data().createdAt).toISOString(),
    })) as unknown as Order[];

    // 2. Fetch all affiliates to map affiliateId (doc ID) to userId (Auth UID)
    const affiliatesRef = collection(firestore, 'affiliates');
    const affiliateSnapshot = await getDocs(affiliatesRef);
    const affiliates = affiliateSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Affiliate[];

    const affiliateIdToUserId = new Map<string, string>();
    affiliates.forEach(a => affiliateIdToUserId.set(a.id, a.userId));

    // 3. Set main admin cache
    const adminCacheRef = doc(firestore, 'cachedData', 'allOrders');
    batch.set(adminCacheRef, {
      orders: allOrders,
      lastUpdated: serverTimestamp(),
    });

    // 4. Group orders by affiliate userId
    const ordersByAffiliateUserId = new Map<string, Order[]>();
    allOrders.forEach(order => {
        if (order.affiliateId) {
            const userId = affiliateIdToUserId.get(order.affiliateId);
            if (userId) {
                if (!ordersByAffiliateUserId.has(userId)) {
                    ordersByAffiliateUserId.set(userId, []);
                }
                ordersByAffiliateUserId.get(userId)!.push(order);
            }
        }
    });

    // 5. Write affiliate-specific caches
    ordersByAffiliateUserId.forEach((orders, userId) => {
        const affiliateOrdersCacheRef = doc(firestore, 'cachedData', `affiliate_orders_${userId}`);
        batch.set(affiliateOrdersCacheRef, {
            orders: orders,
            lastUpdated: serverTimestamp(),
        });
    });

    // 6. Write affiliate-specific stats caches (mirroring data from affiliates collection)
    affiliates.forEach(affiliate => {
        const affiliateStatsCacheRef = doc(firestore, 'cachedData', `affiliate_stats_${affiliate.userId}`);
        batch.set(affiliateStatsCacheRef, {
            totalOrders: affiliate.totalOrders || 0,
            totalEarnings: affiliate.totalEarnings || 0,
            commissionRate: affiliate.commissionRate || 0,
            status: affiliate.status,
            lastUpdated: serverTimestamp(),
        });
    });

    await batch.commit();
    return allOrders.length;
  } catch (error) {
    console.error("Error updating order cache:", error);
    if ((error as any).code === 'permission-denied') {
      const permissionError = new FirestorePermissionError({
        path: 'cachedData/batch-update',
        operation: 'write',
      });
      errorEmitter.emit('permission-error', permissionError);
      throw new Error('You do not have permission to update the order cache.');
    }
    throw error;
  }
}
