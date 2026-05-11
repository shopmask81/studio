'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * ATTRIBUTION STRATEGY
 * 'last-click': New referral codes overwrite old ones (standard for most e-commerce).
 * 'first-click': The first referral code the user uses sticks until cleared.
 */
const ATTRIBUTION_STRATEGY: 'first-click' | 'last-click' = 'last-click';

/**
 * An invisible component that listens for 'ref' in the URL query string.
 * If found, it persists the referral code to localStorage for use during checkout.
 */
export function AffiliateTracker() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');

  useEffect(() => {
    if (refCode) {
      const normalizedCode = refCode.toUpperCase().trim();
      const existingRef = localStorage.getItem('affiliate_ref');

      if (ATTRIBUTION_STRATEGY === 'last-click' || !existingRef) {
        console.log(`Affiliate referral detected and stored: ${normalizedCode}`);
        localStorage.setItem('affiliate_ref', normalizedCode);
      } else {
        console.log(`Affiliate referral ignored (first-click strategy): ${normalizedCode}. Existing: ${existingRef}`);
      }
    }
  }, [refCode]);

  return null;
}
