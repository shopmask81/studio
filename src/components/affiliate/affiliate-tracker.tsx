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

  useEffect(() => {
    if (refCode) {
      const normalizedCode = refCode.toUpperCase().trim();
      const existingRef = localStorage.getItem('affiliate_ref');

      if (ATTRIBUTION_STRATEGY === 'last-click' || !existingRef) {
        console.log(`[Affiliate System] Tracking code detected: ${normalizedCode}`);
        localStorage.setItem('affiliate_ref', normalizedCode);
        localStorage.setItem('affiliate_ref_timestamp', Date.now().toString());
      }
    }
  }, [refCode]);

  return null;
}
