'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { CartProvider } from '@/components/cart/cart-provider';
import { ProductCacheProvider } from './products/product-cache-provider';
import { CategoryCacheProvider } from './category/category-cache-provider';
import siteSettings from '@/../appData/siteSettings.json';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider 
      defaultTheme={siteSettings.defaultThemeMode || 'light'} 
      storageKey="maskshop-theme"
    >
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
