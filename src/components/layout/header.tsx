'use client';

import Link from 'next/link';
import { Heart, Theater } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserNav } from '@/components/auth/user-nav';
import { CartIcon } from '@/components/cart/cart-icon';
import { useUser } from '@/firebase';
import { useWishlist } from '../wishlist/wishlist-provider';

export function Header() {
  const { user } = useUser();
  const { wishlistItemCount } = useWishlist();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Theater className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block font-headline">
              MaskShop
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
           <UserNav />
           <ThemeToggle />
           <Link href="/wishlist" className="relative group transition-all duration-300 ease-in-out p-2">
              <Heart className="h-5 w-5 text-foreground/80 group-hover:text-primary transition-colors duration-300" />
              {wishlistItemCount > 0 && (
                  <span
                      className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                      aria-label={`${wishlistItemCount} items in wishlist`}
                  >
                      {wishlistItemCount}
                  </span>
              )}
              <span className="sr-only">Wishlist</span>
          </Link>
          <CartIcon />
        </div>
      </div>
    </header>
  );
}
