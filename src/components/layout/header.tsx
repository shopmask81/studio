'use client';

import Link from 'next/link';
import { Theater } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserNav } from '@/components/auth/user-nav';
import { CartIcon } from '@/components/cart/cart-icon';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Theater className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block font-headline">
              MaskShopv2
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <CartIcon />
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
