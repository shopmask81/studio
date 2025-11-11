'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDoc, useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, setDoc, deleteDoc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/cart-provider';
import { useToast } from '@/hooks/use-toast';
import { Heart, ShoppingCart, Loader2, AlertCircle, ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ProductDetailsProps {
  productId: string;
}

export function ProductDetails({ productId }: ProductDetailsProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const productRef = useMemoFirebase(() => {
    if (!firestore || !productId) return null;
    return doc(firestore, 'products', productId);
  }, [firestore, productId]);

  const { data: product, isLoading, error } = useDoc<Product>(productRef);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const wishlistCollectionRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/wishlists`);
  }, [user, firestore]);

  const { data: wishlistItems } = useCollection(wishlistCollectionRef);
  
  useEffect(() => {
      if (product) {
          setSelectedImage(product.mainImage);
      }
  }, [product]);

  useEffect(() => {
    if (wishlistItems) {
      setIsWishlisted(wishlistItems.some(item => item.id === productId));
    }
  }, [wishlistItems, productId]);

  const handleWishlistClick = async () => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Please log in',
        description: 'You need to be logged in to add items to your wishlist.',
        action: <Button onClick={() => router.push('/login')}>Login</Button>
      });
      return;
    }

    if (!product) return;
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
        variant: 'destructive',
        title: 'Something went wrong',
        description: error.message || 'Could not update your wishlist.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
         <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-3xl font-headline mb-2">Product Not Found</h1>
        <p className="text-muted-foreground mb-6">Sorry, we couldn't find the product you're looking for.</p>
        <Button asChild>
          <Link href="/">Return to Shop</Link>
        </Button>
      </div>
    );
  }

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const imageGallery = [product.mainImage, ...(product.images || [])];

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-primary transition-colors flex items-center">
                <Home className="h-4 w-4 mr-1.5" />
                Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href="/" className="hover:text-primary transition-colors">
                Products
            </Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="font-medium text-foreground truncate">{product.name}</span>
        </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
        {/* Image Gallery */}
        <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg shadow-lg">
                {selectedImage && (
                    <Image
                        key={selectedImage} // Force re-render on image change for transition
                        src={selectedImage}
                        alt={product.name}
                        fill
                        className="object-cover animate-in fade-in duration-300"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                )}
            </div>
            {imageGallery.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {imageGallery.map((img, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedImage(img)}
                            className={cn(
                                "relative aspect-square w-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors",
                                selectedImage === img ? "border-primary" : "border-transparent"
                            )}
                        >
                            <Image
                                src={img}
                                alt={`${product.name} thumbnail ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
        
        {/* Product Info */}
        <div>
            <p className="text-primary font-semibold mb-2">{product.category}</p>
            <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4">{product.name}</h1>

            <div className="flex items-baseline gap-3 mb-6">
                {hasDiscount ? (
                    <>
                        <p className="text-4xl font-bold text-destructive">${product.discountPrice?.toFixed(2)}</p>
                        <p className="text-2xl font-medium text-muted-foreground line-through">${product.price.toFixed(2)}</p>
                    </>
                ) : (
                    <p className="text-4xl font-bold text-primary">${product.price.toFixed(2)}</p>
                )}
            </div>

            <p className="text-muted-foreground leading-relaxed mb-8">{product.description}</p>
            
            {product.stock <= 10 && product.stock > 0 && (
                <p className="text-destructive font-medium mb-6">Only {product.stock} left in stock!</p>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                    size="lg" 
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className="flex-grow"
                >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
                <Button size="lg" variant="outline" onClick={handleWishlistClick} className="flex-shrink-0">
                    <Heart className={cn("mr-2 h-5 w-5", isWishlisted && "fill-destructive text-destructive")} />
                    {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
