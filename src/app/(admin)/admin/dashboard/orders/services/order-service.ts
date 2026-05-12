
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
 * 4. Main collection sync: Updates 'totalOrders' and 'totalEarnings' in the 'affiliates' collection.
 * 5. Maintenance: Syncs affiliateId, affiliateCode, and commissionRate to the users collection.
 * 6. Data Integrity: Enforces correct commission amount calculation based on current affiliate rates.
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

    // 2. Fetch all affiliates for mapping and accurate commission calculation
    const affiliatesRef = collection(firestore, 'affiliates');
    const affiliateSnapshot = await getDocs(affiliatesRef);
    const affiliates = affiliateSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Affiliate[];

    const affiliateIdMap = new Map<string, Affiliate>();
    const affiliateCodeMap = new Map<string, Affiliate>();
    
    // MAINTENANCE & MAPPING
    affiliates.forEach(a => {
        affiliateIdMap.set(a.id, a);
        
        const userRef = doc(firestore, 'users', a.userId);
        const userUpdateData: any = {
            affiliateId: a.id,
            commissionRate: a.commissionRate, // Ensure rate is synced to user profile
            role: 'affiliate',
            updatedAt: serverTimestamp()
        };

        if (a.code) {
            const normalizedCode = a.code.toUpperCase().trim();
            affiliateCodeMap.set(normalizedCode, a);
            userUpdateData.affiliateCode = normalizedCode;
        }
        
        batch.update(userRef, userUpdateData);
    });

    // 3. Set main admin cache and enforce correct commission values in Order docs
    const ordersByAffiliateUserId = new Map<string, Order[]>();

    allOrders.forEach(order => {
        let matchedAffiliate: Affiliate | undefined = undefined;

        // Strategy A: Primary lookup by ID
        if (order.affiliateId && order.affiliateId !== 'unknown' && order.affiliateId !== 'undefined') {
            matchedAffiliate = affiliateIdMap.get(order.affiliateId);
        }
        
        // Strategy B: Fallback lookup by Code
        if (!matchedAffiliate && order.affiliateCode) {
            matchedAffiliate = affiliateCodeMap.get(order.affiliateCode.toUpperCase().trim());
        }

        if (matchedAffiliate) {
            // DATA INTEGRITY: Re-calculate commission using the OFFICIAL rate from the DB
            // This fixes issues where the frontend might have sent a default or wrong value.
            const subtotal = order.subtotal || order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const officialCommission = subtotal * matchedAffiliate.commissionRate;
            
            // If the stored commission is different, update the order doc in this batch
            if (order.commissionAmount !== officialCommission || !order.affiliateId) {
                const orderDocRef = doc(firestore, 'orders', order.id);
                batch.update(orderDocRef, {
                    affiliateId: matchedAffiliate.id,
                    commissionAmount: officialCommission,
                    subtotal: subtotal, // Backfill subtotal if missing
                    updatedAt: serverTimestamp()
                });
                // Update local object for the cache being built
                order.commissionAmount = officialCommission;
                order.affiliateId = matchedAffiliate.id;
                order.subtotal = subtotal;
            }

            if (!ordersByAffiliateUserId.has(matchedAffiliate.userId)) {
                ordersByAffiliateUserId.set(matchedAffiliate.userId, []);
            }
            ordersByAffiliateUserId.get(matchedAffiliate.userId)!.push(order);
        }
    });

    // Write main admin cache
    const adminCacheRef = doc(firestore, 'cachedData', 'allOrders');
    batch.set(adminCacheRef, {
      orders: allOrders,
      lastUpdated: serverTimestamp(),
    });

    // 4. Write affiliate-specific caches AND update main collection stats
    affiliates.forEach(affiliate => {
        const affiliateOrders = ordersByAffiliateUserId.get(affiliate.userId) || [];
        
        const deliveredOrders = affiliateOrders.filter(o => o.status === 'delivered');
        const totalEarnings = affiliateOrders.reduce((sum, order) => sum + (order.commissionAmount || 0), 0);

        // A. Update Main Affiliate Document
        const affiliateDocRef = doc(firestore, 'affiliates', affiliate.id);
        batch.update(affiliateDocRef, {
            totalOrders: affiliateOrders.length,
            totalEarnings: totalEarnings,
            updatedAt: serverTimestamp()
        });

        // B. Cache Orders List
        const affiliateOrdersCacheRef = doc(firestore, 'cachedData', `affiliate_orders_${affiliate.userId}`);
        batch.set(affiliateOrdersCacheRef, {
            orders: affiliateOrders,
            lastUpdated: serverTimestamp(),
        });

        // C. Cache Stats (For Affiliate Dashboard)
        const affiliateStatsCacheRef = doc(firestore, 'cachedData', `affiliate_stats_${affiliate.userId}`);
        batch.set(affiliateStatsCacheRef, {
            totalOrders: affiliateOrders.length,
            deliveredOrders: deliveredOrders.length,
            totalEarnings: totalEarnings,
            commissionRate: affiliate.commissionRate,
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
