
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * ATTRIBUTION STRATEGY
 * 'last-click': New referral codes overwrite old ones.
 */
const ATTRIBUTION_STRATEGY: 'last-click' | 'first-click' = 'last-click';

export function AffiliateTracker() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');
  const affId = searchParams.get('aid');
  const rate = searchParams.get('rate');

  useEffect(() => {
    // ZERO-QUERY ARCHITECTURE: 
    // We extract the code, ID, and optionally the commission rate from the URL.
    if (refCode && affId && affId !== 'unknown' && affId !== 'undefined') {
      const normalizedCode = refCode.toUpperCase().trim();
      const existingRef = localStorage.getItem('affiliate_data');

      if (ATTRIBUTION_STRATEGY === 'last-click' || !existingRef) {
        const trackerData = {
            id: affId,
            code: normalizedCode,
            rate: rate ? parseFloat(rate) : 0.1, // Default 10% if not in URL
            timestamp: Date.now()
        };

        localStorage.setItem('affiliate_data', JSON.stringify(trackerData));
        console.log(`[Affiliate System] Tracking persisted: ${normalizedCode} (${affId}) at ${trackerData.rate * 100}%`);
      }
    }
  }, [refCode, affId, rate]);

  return null;
}
