'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { useCart } from '@/components/cart/cart-provider';
import { Button } from '@/components/ui/button';

export function CartIcon() {
  const { itemCount } = useCart();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsLoading(true);
    router.push('/cart');
  };

  return (
    <Button 
      asChild 
      variant="ghost" 
      size="icon" 
      className="relative group transition-all duration-300 ease-in-out" 
      aria-label="Open cart"
      disabled={isLoading}
    >
      <Link href="/cart" onClick={handleClick}>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <>
            <ShoppingBag className="h-5 w-5 text-foreground/80 group-hover:text-primary transition-colors duration-300" />
            {itemCount > 0 && (
              <span
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
              >
                {itemCount}
              </span>
            )}
          </>
        )}
        <span className="sr-only">Cart</span>
      </Link>
    </Button>
  );
}
