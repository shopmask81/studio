
'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { CartProvider } from '@/components/cart/cart-provider';
import { ProductCacheProvider } from './products/product-cache-provider';
import { CategoryCacheProvider } from './category/category-cache-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="maskshop-theme">
      <ProductCacheProvider>
        <CategoryCacheProvider>
            <CartProvider>
                {children}
            </CartProvider>
        </CategoryCacheProvider>
      </ProductCacheProvider>
    </ThemeProvider>
  );
}
