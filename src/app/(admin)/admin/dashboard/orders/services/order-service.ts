
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
 * 4. Maintenance: Syncs affiliateId and affiliateCode to the users collection for all affiliates.
 * 
 * @param firestore The Firestore database instance.
 * @returns {Promise<number>} The number of orders cached in the main admin document.
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
      createdAt: (doc.data().createdAt as Timestamp)?.toDate ? (doc.data().createdAt as Timestamp).toDate().toISOString() : new Date(doc.data().createdAt as any).toISOString(),
    })) as unknown as Order[];

    // 2. Fetch all affiliates to map affiliateId (doc ID) AND affiliateCode to userId (Auth UID)
    const affiliatesRef = collection(firestore, 'affiliates');
    const affiliateSnapshot = await getDocs(affiliatesRef);
    const affiliates = affiliateSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Affiliate[];

    const affiliateIdToUserId = new Map<string, string>();
    const affiliateCodeToUserId = new Map<string, string>();
    
    // MAINTENANCE & MAPPING
    affiliates.forEach(a => {
        affiliateIdToUserId.set(a.id, a.userId);
        
        const userRef = doc(firestore, 'users', a.userId);
        const userUpdateData: any = {
            affiliateId: a.id,
            role: 'affiliate',
            updatedAt: serverTimestamp()
        };

        if (a.code) {
            const normalizedCode = a.code.toUpperCase().trim();
            affiliateCodeToUserId.set(normalizedCode, a.userId);
            userUpdateData.affiliateCode = normalizedCode;
        }
        
        // Sync critical fields back to the user document
        batch.update(userRef, userUpdateData);
    });

    // 3. Set main admin cache
    const adminCacheRef = doc(firestore, 'cachedData', 'allOrders');
    batch.set(adminCacheRef, {
      orders: allOrders,
      lastUpdated: serverTimestamp(),
    });

    // 4. Group orders by affiliate userId
    const ordersByAffiliateUserId = new Map<string, Order[]>();
    
    allOrders.forEach(order => {
        let targetUserId = null;

        // Strategy A: Primary lookup by ID
        if (order.affiliateId && order.affiliateId !== 'unknown' && order.affiliateId !== 'undefined') {
            targetUserId = affiliateIdToUserId.get(order.affiliateId);
        }
        
        // Strategy B: Fallback lookup by Code
        if (!targetUserId && order.affiliateCode) {
            targetUserId = affiliateCodeToUserId.get(order.affiliateCode.toUpperCase().trim());
        }

        if (targetUserId) {
            if (!ordersByAffiliateUserId.has(targetUserId)) {
                ordersByAffiliateUserId.set(targetUserId, []);
            }
            ordersByAffiliateUserId.get(targetUserId)!.push(order);
        }
    });

    // 5. Write affiliate-specific caches (Orders & Dynamic Stats)
    affiliates.forEach(affiliate => {
        const affiliateOrders = ordersByAffiliateUserId.get(affiliate.userId) || [];
        
        // CALCULATE STATS DYNAMICALLY FROM THE ACTUAL ORDERS LIST
        const deliveredOrders = affiliateOrders.filter(o => o.status === 'delivered');
        const totalEarnings = affiliateOrders.reduce((sum, order) => sum + (order.commissionAmount || 0), 0);

        // A. Cache Orders List
        const affiliateOrdersCacheRef = doc(firestore, 'cachedData', `affiliate_orders_${affiliate.userId}`);
        batch.set(affiliateOrdersCacheRef, {
            orders: affiliateOrders,
            lastUpdated: serverTimestamp(),
        });

        // B. Cache Stats (Fully Dynamic)
        const affiliateStatsCacheRef = doc(firestore, 'cachedData', `affiliate_stats_${affiliate.userId}`);
        batch.set(affiliateStatsCacheRef, {
            totalOrders: affiliateOrders.length,
            deliveredOrders: deliveredOrders.length,
            totalEarnings: totalEarnings, // Calculated from orders, not the affiliate doc
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
