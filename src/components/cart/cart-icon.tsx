'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/components/cart/cart-provider';
import { Button } from '@/components/ui/button';

export function CartIcon() {
  const { itemCount } = useCart();

  return (
    <Button asChild variant="ghost" size="icon" className="relative" aria-label="Open cart">
      <Link href="/cart">
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          >
            {itemCount}
          </span>
        )}
        <span className="sr-only">Cart</span>
      </Link>
    </Button>
  );
}
