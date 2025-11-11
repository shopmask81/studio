'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { CartProvider } from '@/components/cart/cart-provider';
import { WishlistProvider } from './wishlist/wishlist-provider';
import { AuthSync } from '@/hooks/use-auth-sync';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="maskshop-theme">
      <WishlistProvider>
        <CartProvider>
          <AuthSync />
          {children}
        </CartProvider>
      </WishlistProvider>
    </ThemeProvider>
  );
}
