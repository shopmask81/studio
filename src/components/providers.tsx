'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { CartProvider } from '@/components/cart/cart-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="maskshop-theme">
        <CartProvider>
            {children}
        </CartProvider>
    </ThemeProvider>
  );
}
