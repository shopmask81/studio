
'use client';

import { createContext, useContext, useState, type ReactNode, useMemo, useCallback } from 'react';
import type { Currency } from '@/lib/types';
import siteSettings from '@/../appData/siteSettings.json';

type CurrencyContextType = {
  currency: Currency;
  formatPrice: (price: number) => string;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // The currency is globally determined by the site settings.
  const currency = useMemo(() => siteSettings.defaultCurrency as Currency || 'AED', []);

  // This function now ONLY formats the price with the correct symbol, without any conversion.
  const formatPrice = useCallback((price: number): string => {
    switch (currency) {
      case 'USD':
        return `${price.toFixed(2)} $`;
      case 'EUR':
        return `${price.toFixed(2)} €`;
      case 'AED':
        return `${price.toFixed(2)} AED`;
      case 'MAD':
        return `${price.toFixed(2)} MAD`;
      default:
        // Fallback for any other currency codes
        return `${price.toFixed(2)} ${currency}`;
    }
  }, [currency]);

  const value = {
    currency,
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
