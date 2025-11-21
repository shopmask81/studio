
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/cart-provider';
import { useTranslation } from '../language/language-provider';
import { useModal } from '../modals/modal-provider';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { showModal } = useModal();
  const { t, language } = useTranslation();

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
    <Link href={`/products/${product.id}`} className="group block">
        <Card className="overflow-hidden flex flex-col h-full transition-all duration-300 ease-in-out dark:bg-gradient-to-br dark:from-[#232a26] dark:to-[#1b201d] dark:shadow-[0_4px_14px_rgba(0,0,0,0.4)] group-hover:dark:shadow-[0_8px_20px_rgba(0,0,0,0.5)] group-hover:dark:-translate-y-1 group-hover:dark:from-[#272e2a] group-hover:dark:to-[#1f2522] group-hover:dark:border-primary/30">
            <CardHeader className="p-0">
                <div className="relative aspect-[3/4] w-full overflow-hidden">
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
            <CardContent className="p-4 flex-grow">
                <CardTitle className="font-headline text-2xl mb-2 group-hover:text-primary transition-colors" dir={dir} style={style}>{displayName}</CardTitle>
            </CardContent>
            <CardFooter className="p-4 flex justify-between items-center mt-auto">
                <div className="flex items-baseline gap-2">
                    {isFromPrice && <span className="text-sm text-muted-foreground mr-1">From</span>}
                    {hasDiscount ? (
                        <>
                            <p className="text-xl font-bold text-accent dark:text-shadow-glow">${displayPrice.toFixed(2)}</p>
                            <p className="text-sm font-medium text-muted-foreground line-through">${originalPrice?.toFixed(2)}</p>
                        </>
                    ) : (
                        <p className="text-xl font-bold text-accent dark:text-shadow-glow">${displayPrice.toFixed(2)}</p>
                    )}
                </div>
                 <Button onClick={handleAddToCart} variant="secondary" className="bg-primary text-primary-foreground font-semibold hover:bg-ring hover:shadow-accent-glow transition-all duration-200 ease-in-out">
                    <ShoppingCart className="h-4 w-4 me-2" />
                    {hasVariants ? 'Select Options' : t('add_to_cart').text}
                </Button>
            </CardFooter>
        </Card>
    </Link>
  );
}
