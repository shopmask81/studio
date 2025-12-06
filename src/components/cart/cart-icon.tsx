'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { useCart } from '@/components/cart/cart-provider';
import { Button } from '@/components/ui/button';

export function CartIcon() {
  const { itemCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Prevent default only if we are not already on the cart page
    if (pathname !== '/cart') {
      e.preventDefault();
      setIsLoading(true);
      router.push('/cart');
    }
    // If we are already on the cart page, let the link do a normal refresh.
  };
  
  // Effect to turn off loading state when navigation completes
  useEffect(() => {
    if (isLoading) {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);


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
