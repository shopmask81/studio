'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * ATTRIBUTION STRATEGY
 * 'last-click': New referral codes overwrite old ones.
 */
const ATTRIBUTION_STRATEGY: 'first-click' | 'last-click' = 'last-click';

export function AffiliateTracker() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');
  const firestore = useFirestore();

  useEffect(() => {
    if (refCode && firestore) {
      const normalizedCode = refCode.toUpperCase().trim();
      const existingRef = localStorage.getItem('affiliate_data');

      // Only resolve if we need to (last-click or no existing data)
      if (ATTRIBUTION_STRATEGY === 'last-click' || !existingRef) {
        const resolveAffiliate = async () => {
            try {
                console.log(`[Affiliate System] Resolving tracking code: ${normalizedCode}`);
                
                const affQuery = query(
                    collection(firestore, 'affiliates'), 
                    where('code', '==', normalizedCode), 
                    where('status', '==', 'active'), 
                    limit(1)
                );
                
                const querySnapshot = await getDocs(affQuery);
                
                if (!querySnapshot.empty) {
                    const affDoc = querySnapshot.docs[0];
                    const affData = affDoc.data();
                    
                    const trackerData = {
                        id: affDoc.id,
                        code: normalizedCode,
                        commissionRate: affData.commissionRate || 0,
                        timestamp: Date.now()
                    };

                    localStorage.setItem('affiliate_data', JSON.stringify(trackerData));
                    console.log(`[Affiliate System] Tracking active for: ${normalizedCode} (${affDoc.id})`);
                } else {
                    console.warn(`[Affiliate System] Invalid or inactive code: ${normalizedCode}`);
                }
            } catch (error) {
                console.error("[Affiliate System] Failed to resolve referral:", error);
            }
        };

        resolveAffiliate();
      }
    }
  }, [refCode, firestore]);

  return null;
}
