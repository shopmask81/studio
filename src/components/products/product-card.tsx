'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart } from 'lucide-react';
import type { Product, WishlistItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/cart-provider';
import { useWishlist } from '../wishlist/wishlist-provider';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useTranslation } from '../language/language-provider';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const router = useRouter();
  const { t } = useTranslation();

  const productIsWishlisted = isWishlisted(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
        // For guest users, wishlist is handled by the provider via localStorage
        // but we can still prompt them to log in for a better experience.
        toast({
            variant: "default",
            title: "Want to save this for later?",
            description: "Log in or create an account to save your wishlist across devices.",
            action: <Button onClick={() => router.push('/login')}>Login</Button>
        });
    }
    
    if (productIsWishlisted) {
      removeFromWishlist(product.id);
      toast({
        title: 'Removed from Wishlist',
        description: `${product.name} has been removed from your wishlist.`,
      });
    } else {
      addToWishlist({
        productId: product.id,
        productName: product.name,
        productImage: product.mainImage,
        price: product.discountPrice ?? product.price,
      });
      toast({
        title: 'Added to Wishlist',
        description: `${product.name} has been added to your wishlist.`,
      });
    }
  };

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

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
                <Button variant="ghost" size="icon" onClick={handleWishlistClick} aria-label="Add to wishlist" className="absolute top-2 right-2 bg-background/50 hover:bg-background/80 rounded-full z-10">
                    <Heart className={cn("h-5 w-5 text-primary", productIsWishlisted && "fill-destructive text-destructive")} />
                </Button>
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <CardTitle className="font-headline text-2xl mb-2 group-hover:text-primary transition-colors">{product.name}</CardTitle>
            </CardContent>
            <CardFooter className="p-4 flex justify-between items-center mt-auto">
                <div className="flex items-baseline gap-2">
                    {hasDiscount ? (
                        <>
                            <p className="text-xl font-bold text-accent dark:text-shadow-glow">${product.discountPrice?.toFixed(2)}</p>
                            <p className="text-sm font-medium text-muted-foreground line-through">${product.price.toFixed(2)}</p>
                        </>
                    ) : (
                        <p className="text-xl font-bold text-accent dark:text-shadow-glow">${product.price.toFixed(2)}</p>
                    )}
                </div>
                 <Button onClick={handleAddToCart} variant="secondary" className="bg-primary text-primary-foreground font-semibold hover:bg-ring hover:shadow-accent-glow transition-all duration-200 ease-in-out">
                    <ShoppingCart className="h-4 w-4 me-2" />
                    {t('add_to_cart').text}
                </Button>
            </CardFooter>
        </Card>
    </Link>
  );
}
