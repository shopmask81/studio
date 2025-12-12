
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Loader2 } from 'lucide-react';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/cart-provider';
import { useTranslation } from '../language/language-provider';
import { useModal } from '../modals/modal-provider';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCurrency } from '../currency/currency-provider';
import { Badge } from '../ui/badge';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { showModal } = useModal();
  const { t, language } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    // Reset loading state if the path changes (navigation completes)
    setIsNavigating(false);
  }, [pathname]);

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigating(true);
    router.push(`/products/${product.id}`);
  };
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.variantsEnabled && product.variants && product.variants.length > 0) {
      showModal('selectVariant', { product });
    } else {
      addToCart(product);
    }
  };

  const displayName = (language === 'ar' && product.name_ar) || product.name;
  const { dir, style } = t(displayName);

  let displayPrice: number;
  let originalPrice: number | null = null;

  if (product.variantsEnabled && product.variants && product.variants.length > 0) {
    const validVariants = product.variants.filter(v => v.price > 0);

    if (validVariants.length > 0) {
      const minPrice = Math.min(...validVariants.map(v => v.price));
      const minDiscountPrice = Math.min(...validVariants.map(v => v.discountPrice ?? v.price));
      
      displayPrice = minDiscountPrice;
      if (minDiscountPrice < minPrice) {
        originalPrice = minPrice;
      }
    } else {
        displayPrice = 0; // Fallback for misconfigured variants
    }
  } else {
    displayPrice = product.price;
    if (product.discountPrice && product.discountPrice < product.price) {
        originalPrice = product.price;
        displayPrice = product.discountPrice;
    }
  }

  const hasDiscount = originalPrice !== null;
  const isFromPrice = product.variantsEnabled && product.variants && product.variants.length > 1;
  const hasVariants = product.variantsEnabled && product.variants && product.variants.length > 0;

  return (
    <Link href={`/products/${product.id}`} onClick={handleCardClick} className="group block relative">
      {isNavigating && (
        <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-20 rounded-lg">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}
      {product.featured && (
        <Badge className="absolute top-4 left-4 z-10 bg-[#990000] text-white px-3 py-1 text-sm border-[#990000]">
            Featured
        </Badge>
      )}
      <Card className="flex flex-col h-full transition-all duration-300 ease-in-out dark:shadow-card-warm shadow-card-warm dark:hover:shadow-lg hover:shadow-card-warm-hover dark:hover:-translate-y-1 hover:-translate-y-0.5 relative">
          <CardHeader className="p-0 rounded-t-lg overflow-hidden">
              <div className="relative aspect-[3/4] w-full">
              <Image
                  src={product.mainImage}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  data-ai-hint={product.imageHint}
              />
              </div>
          </CardHeader>
          <CardContent className="p-3 md:p-4 flex-grow">
              <CardTitle className="font-headline text-xl md:text-2xl mb-2 group-hover:text-primary transition-colors line-clamp-2 min-h-[3rem]" dir={dir} style={style}>
                  {displayName}
              </CardTitle>
          </CardContent>
          <CardFooter className="p-3 md:p-4 flex flex-col items-start gap-3 mt-auto">
              <div className="flex items-baseline gap-2 flex-wrap">
                  {isFromPrice && <span className="text-xs md:text-sm text-muted-foreground mr-1">From</span>}
                  {hasDiscount ? (
                      <>
                          <p className="text-base md:text-lg font-bold text-primary">{formatPrice(displayPrice)}</p>
                          <p className="text-sm md:text-base font-medium text-accent line-through">{formatPrice(originalPrice!)}</p>
                      </>
                  ) : (
                      <p className="text-base md:text-lg font-bold text-primary">{formatPrice(displayPrice)}</p>
                  )}
              </div>
               <Button onClick={handleAddToCart} className="w-full h-9 text-xs md:h-10 md:text-sm font-semibold bg-primary hover:bg-primary/90 transition-all duration-200 ease-in-out">
                  <ShoppingCart className="h-4 w-4 me-2" />
                  {hasVariants ? 'Select Options' : t('add_to_cart').text}
              </Button>
          </CardFooter>
      </Card>
    </Link>
  );
}
