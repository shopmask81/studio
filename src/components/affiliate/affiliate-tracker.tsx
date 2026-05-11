
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * An invisible component that listens for 'ref' in the URL query string.
 * If found, it persists the referral code to localStorage for use during checkout.
 */
export function AffiliateTracker() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');

  useEffect(() => {
    if (refCode) {
      console.log(`Affiliate referral detected: ${refCode}`);
      // Store the referral code in localStorage. 
      // It will persist until the user places an order or the browser cache is cleared.
      localStorage.setItem('affiliate_ref', refCode);
    }
  }, [refCode]);

  return null;
}
