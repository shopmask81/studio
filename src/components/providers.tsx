'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { CartProvider } from '@/components/cart/cart-provider';
import { ProductCacheProvider } from './products/product-cache-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="maskshop-theme">
      <ProductCacheProvider>
        <CartProvider>
            {children}
        </CartProvider>
      </ProductCacheProvider>
    </ThemeProvider>
  );
}
