
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * ATTRIBUTION STRATEGY
 * 'last-click': New referral codes overwrite old ones.
 */
const ATTRIBUTION_STRATEGY: 'first-click' | 'last-click' = 'last-click';

export function AffiliateTracker() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');
  const affId = searchParams.get('aid');

  useEffect(() => {
    // ZERO-QUERY ARCHITECTURE: 
    // We extract both the code and the ID from the URL.
    // Validation: Ensure ID is not the 'unknown' placeholder string.
    if (refCode && affId && affId !== 'unknown' && affId !== 'undefined') {
      const normalizedCode = refCode.toUpperCase().trim();
      const existingRef = localStorage.getItem('affiliate_data');

      if (ATTRIBUTION_STRATEGY === 'last-click' || !existingRef) {
        const trackerData = {
            id: affId,
            code: normalizedCode,
            timestamp: Date.now()
        };

        localStorage.setItem('affiliate_data', JSON.stringify(trackerData));
        console.log(`[Affiliate System] Tracking persisted: ${normalizedCode} (${affId})`);
      }
    }
  }, [refCode, affId]);

  return null;
}
