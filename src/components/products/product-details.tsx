
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/cart-provider';
import { useToast } from '@/hooks/use-toast';
import { Heart, ShoppingCart, Loader2, AlertCircle, ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { useWishlist } from '../wishlist/wishlist-provider';
import { useTranslation } from '../language/language-provider';

interface ProductDetailsProps {
  productId: string;
}

export function ProductDetails({ productId }: ProductDetailsProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useTranslation();
  
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = useState(0)
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  const productRef = useMemo(() => {
    if (!firestore || !productId) return null;
    return doc(firestore, 'products', productId);
  }, [firestore, productId]);

  const { data: product, isLoading, error } = useDoc<Product>(productRef);
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();

  const productIsWishlisted = product ? isWishlisted(product.id) : false;
  
  const imageGallery = useMemo(() => {
      if (!product) return [];
      return [product.mainImage, ...(product.images || [])];
  }, [product]);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }
 
    const handleSelect = () => {
      const selectedSlide = carouselApi.selectedScrollSnap();
      setCurrentSlide(selectedSlide);

      if (thumbnailContainerRef.current) {
        const thumbnail = thumbnailContainerRef.current.children[selectedSlide] as HTMLElement;
        if (thumbnail) {
          const container = thumbnailContainerRef.current;
          const scrollLeft = thumbnail.offsetLeft - (container.offsetWidth / 2) + (thumbnail.offsetWidth / 2);
          container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
      }
    };
    
    handleSelect(); // Set initial position
    carouselApi.on("select", handleSelect);

    return () => {
        carouselApi.off("select", handleSelect);
    }
  }, [carouselApi]);
  
  const handleThumbnailClick = (index: number) => {
    carouselApi?.scrollTo(index);
    setCurrentSlide(index);
  }

  const handleWishlistClick = () => {
    if (!product) return;

    if (!user) {
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
         <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-3xl font-headline mb-2">{t('product_not_found')}</h1>
        <p className="text-muted-foreground mb-6">{t('product_not_found_desc')}</p>
        <Button asChild>
          <Link href="/">{t('return_to_shop')}</Link>
        </Button>
      </div>
    );
  }

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-primary transition-colors flex items-center">
                <Home className="h-4 w-4 me-1.5" />
                {t('home')}
            </Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href="/" className="hover:text-primary transition-colors">
                {t('products')}
            </Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="font-medium text-foreground truncate">{product.name}</span>
        </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
        {/* Image Gallery */}
        <div className="flex flex-col gap-4">
             <div className="flex justify-center">
                <Carousel setApi={setCarouselApi} className="w-full max-w-[90vw] sm:max-w-md">
                    <CarouselContent>
                        {imageGallery.map((img, index) => (
                            <CarouselItem key={index}>
                                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg shadow-lg flex justify-center items-center">
                                    <Image
                                        src={img}
                                        alt={`${product.name} image ${index + 1}`}
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    {imageGallery.length > 1 && (
                        <>
                            <CarouselPrevious className="left-2" />
                            <CarouselNext className="right-2" />
                        </>
                    )}
                </Carousel>
            </div>

            {imageGallery.length > 1 && (
                 <div className="w-full max-w-md mx-auto">
                    <div ref={thumbnailContainerRef} className="flex justify-start gap-2 overflow-x-auto pb-2 max-w-[16.5rem] mx-auto">
                        {imageGallery.map((img, index) => (
                            <button
                                key={index}
                                onClick={() => handleThumbnailClick(index)}
                                className={cn(
                                    "relative aspect-square w-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all",
                                    currentSlide === index ? "border-primary scale-105" : "border-transparent opacity-75 hover:opacity-100"
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
                </div>
            )}
        </div>
        
        {/* Product Info */}
        <div>
            <p className="text-primary font-semibold mb-2">{product.category}</p>
            <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4 break-words">{product.name}</h1>

            <div className="flex items-baseline gap-3 mb-6">
                {hasDiscount ? (
                    <>
                        <p className="text-4xl font-bold text-primary">${product.discountPrice?.toFixed(2)}</p>
                        <p className="text-2xl font-medium text-muted-foreground line-through">${product.price.toFixed(2)}</p>
                    </>
                ) : (
                    <p className="text-4xl font-bold text-primary">${product.price.toFixed(2)}</p>
                )}
            </div>

            <p className="text-muted-foreground leading-relaxed mb-8 break-words text-justify">{product.description}</p>
            
            {product.stock <= 10 && product.stock > 0 && (
                <p className={cn(
                    "font-bold mb-6 transition-colors duration-200",
                    product.stock <= 5 ? "text-red-500" : "text-amber-500"
                )}>
                    {t('only_left_in_stock', { count: product.stock })}
                </p>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                    size="lg" 
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className="flex-grow"
                >
                    <ShoppingCart className="me-2 h-5 w-5" />
                    {product.stock === 0 ? t('out_of_stock') : t('add_to_cart')}
                </Button>
                <Button size="lg" variant="outline" onClick={handleWishlistClick} className="flex-shrink-0">
                    <Heart className={cn("me-2 h-5 w-5", productIsWishlisted && "fill-destructive text-destructive")} />
                    {productIsWishlisted ? t('remove_from_wishlist') : t('add_to_wishlist')}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
