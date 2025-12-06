
'use client';

import { createContext, useContext, useState, type ReactNode, useMemo, useCallback } from 'react';
import type { Currency } from '@/lib/types';
import siteSettings from '@/../appData/siteSettings.json';

const CONVERSION_RATES: Record<Currency, number> = {
  AED: 1, // Base currency
  USD: 3.67,
  MAD: 10,
  EUR: 0.92,
};

type CurrencyContextType = {
  currency: Currency;
  convertPrice: (priceInAed: number) => number;
  formatPrice: (price: number) => string;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // The currency is now globally determined by the site settings.
  // There is no client-side state to manage it anymore.
  const currency = useMemo(() => siteSettings.defaultCurrency as Currency || 'AED', []);

  const convertPrice = useCallback((priceInAed: number): number => {
    const rate = CONVERSION_RATES[currency];
    // Since AED is the base, we need to divide to get the target currency value.
    return priceInAed / rate;
  }, [currency]);
  
  const formatPrice = useCallback((price: number): string => {
    const convertedPrice = convertPrice(price);
    
    switch (currency) {
      case 'USD':
        return `$${convertedPrice.toFixed(2)}`;
      case 'EUR':
        return `€${convertedPrice.toFixed(2)}`;
      case 'AED':
        return `AED ${convertedPrice.toFixed(2)}`;
      case 'MAD':
        return `MAD ${convertedPrice.toFixed(2)}`;
      default:
        return `${convertedPrice.toFixed(2)} ${currency}`;
    }
  }, [currency, convertPrice]);


  const value = {
    currency,
    convertPrice,
    formatPrice,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
