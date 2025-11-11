'use client';

import Image from 'next/image';
import { Heart, ShoppingCart } from 'lucide-react';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/components/cart/cart-provider';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, setDoc, deleteDoc, collection } from 'firebase/firestore';


interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const wishlistCollectionRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/wishlists`);
  }, [user, firestore]);

  const { data: wishlistItems } = useCollection(wishlistCollectionRef);

  useEffect(() => {
    if (wishlistItems) {
      setIsWishlisted(wishlistItems.some(item => item.id === product.id));
    }
  }, [wishlistItems, product.id]);

  const handleWishlistClick = async () => {
    if (!user || !firestore) {
        toast({
            variant: "destructive",
            title: "Please log in",
            description: "You need to be logged in to add items to your wishlist.",
            action: <Button onClick={() => router.push('/login')}>Login</Button>
        });
        return;
    }
    
    const wishlistItemRef = doc(firestore, `users/${user.uid}/wishlists`, product.id);

    try {
        if (isWishlisted) {
            await deleteDoc(wishlistItemRef);
            toast({
              title: 'Removed from Wishlist',
              description: `${product.name} has been removed from your wishlist.`,
            });
        } else {
            await setDoc(wishlistItemRef, { productId: product.id });
            toast({
              title: 'Added to Wishlist',
              description: `${product.name} has been added to your wishlist.`,
            });
        }
        setIsWishlisted(!isWishlisted);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Something went wrong",
            description: error.message || "Could not update your wishlist.",
        });
    }
  };

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <Card className="overflow-hidden flex flex-col shadow-md hover:shadow-primary/20 transition-shadow duration-300 group">
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
           <Button variant="ghost" size="icon" onClick={handleWishlistClick} aria-label="Add to wishlist" className="absolute top-2 right-2 bg-background/50 hover:bg-background/80 rounded-full">
            <Heart className={cn("h-5 w-5 text-primary", isWishlisted && "fill-destructive text-destructive")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <p className="text-sm text-muted-foreground mb-1">{product.category}</p>
        <CardTitle className="font-headline text-2xl mb-2">{product.name}</CardTitle>
        <p className="text-muted-foreground text-sm line-clamp-2">{product.description}</p>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
        <div className="flex items-baseline gap-2">
            {hasDiscount ? (
                <>
                    <p className="text-xl font-bold text-destructive">${product.discountPrice?.toFixed(2)}</p>
                    <p className="text-sm font-medium text-muted-foreground line-through">${product.price.toFixed(2)}</p>
                </>
            ) : (
                 <p className="text-xl font-bold text-primary">${product.price.toFixed(2)}</p>
            )}
        </div>
        <Button onClick={() => addToCart(product)} aria-label="Add to cart" disabled={product.stock === 0}>
          {product.stock === 0 ? 'Out of Stock' : <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </>}
        </Button>
      </CardFooter>
    </Card>
  );
}
