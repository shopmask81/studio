
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/cart-provider';
import { ShoppingCart, Loader2, AlertCircle, ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { useTranslation } from '../language/language-provider';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { useProductCache } from './product-cache-provider';
import { useCurrency } from '../currency/currency-provider';

interface ProductDetailsProps {
  productId: string;
}

export function ProductDetails({ productId }: ProductDetailsProps) {
  const { addToCart } = useCart();
  const { t, language } = useTranslation();
  const { findProductById, isLoading: isCacheLoading } = useProductCache();
  const { formatPrice } = useCurrency();
  
  const product = useMemo(() => findProductById(productId), [findProductById, productId]);

  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = useState(0)
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Effect to set default selections when product loads
  useEffect(() => {
    if (product?.variantsEnabled) {
        setSelectedColor(product.variantOptions?.colors?.[0] || null);
        setSelectedSize(product.variantOptions?.sizes?.[0] || null);
    }
  }, [product]);

  const selectedVariant = useMemo(() => {
    if (!product?.variantsEnabled || !product.variants || (!selectedColor && !selectedSize)) return null;
    
    return product.variants.find(v => 
        (product.variantOptions?.colors?.length ? v.color === selectedColor : true) &&
        (product.variantOptions?.sizes?.length ? v.size === selectedSize : true)
    );
  }, [product, selectedColor, selectedSize]);

  const displayPrice = selectedVariant?.price ?? product?.price;
  const displayDiscountPrice = selectedVariant?.discountPrice ?? product?.discountPrice;
  const hasDiscount = displayDiscountPrice && displayPrice && displayDiscountPrice < displayPrice;

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

  const handleAddToCart = () => {
    if (!product) return;
    
    // Check if variants are enabled and if a selection is required but not made
    if (product.variantsEnabled) {
      if ((product.variantOptions?.colors?.length || 0) > 0 && !selectedColor) {
        // This case is handled by disabling the button, but as a fallback:
        alert("Please select a color.");
        return;
      }
      if ((product.variantOptions?.sizes?.length || 0) > 0 && !selectedSize) {
        alert("Please select a size.");
        return;
      }
    }

    addToCart(product, 1, product.variantsEnabled ? { color: selectedColor!, size: selectedSize! } : undefined);
  };

  if (isCacheLoading) {
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
        <h1 className="text-3xl font-headline mb-2" {...t('product_not_found')}>{t('product_not_found').text}</h1>
        <p className="text-muted-foreground mb-6" {...t('product_not_found_desc')}>{t('product_not_found_desc').text}</p>
        <Button asChild>
          <Link href="/">{t('return_to_shop').text}</Link>
        </Button>
      </div>
    );
  }
  
  const displayName = (language === 'ar' && product.name_ar) || product.name;
  const displayDescription = (language === 'ar' && product.description_ar) || product.description;
  const { dir: nameDir, style: nameStyle } = t(displayName);
  const { dir: descDir, style: descStyle } = t(displayDescription);

  return (
    <>
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-primary transition-colors flex items-center">
                <Home className="h-4 w-4 me-1.5" />
                {t('home').text}
            </Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link href="/" className="hover:text-primary transition-colors">
                {t('products').text}
            </Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="font-medium text-foreground truncate">{displayName}</span>
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
            <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4 break-words" dir={nameDir} style={nameStyle}>{displayName}</h1>

             {/* Variants Selection */}
            {product.variantsEnabled && (
                <div className="space-y-6 mb-6">
                    {product.variantOptions?.colors && product.variantOptions.colors.length > 0 && (
                        <div>
                            <Label className="text-base font-semibold">Color: <span className="text-muted-foreground font-normal">{selectedColor}</span></Label>
                             <RadioGroup value={selectedColor || undefined} onValueChange={setSelectedColor} className="flex flex-wrap gap-2 mt-2">
                                {product.variantOptions.colors.map(color => (
                                    <RadioGroupItem key={color} value={color} id={`color-${color}`} className="sr-only" />
                                ))}
                                {product.variantOptions.colors.map(color => (
                                    <Label
                                        key={`label-${color}`}
                                        htmlFor={`color-${color}`}
                                        className={cn(
                                            "cursor-pointer rounded-md border-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted",
                                            selectedColor === color ? "border-primary bg-primary/10" : "border-border"
                                        )}
                                    >
                                        {color}
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>
                    )}
                    {product.variantOptions?.sizes && product.variantOptions.sizes.length > 0 && (
                         <div>
                            <Label className="text-base font-semibold">Size: <span className="text-muted-foreground font-normal">{selectedSize}</span></Label>
                             <RadioGroup value={selectedSize || undefined} onValueChange={setSelectedSize} className="flex flex-wrap gap-2 mt-2">
                                {product.variantOptions.sizes.map(size => (
                                    <RadioGroupItem key={size} value={size} id={`size-${size}`} className="sr-only" />
                                ))}
                                {product.variantOptions.sizes.map(size => (
                                    <Label
                                        key={`label-${size}`}
                                        htmlFor={`size-${size}`}
                                        className={cn(
                                            "cursor-pointer rounded-md border-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted",
                                            selectedSize === size ? "border-primary bg-primary/10" : "border-border"
                                        )}
                                    >
                                        {size}
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-baseline gap-3 mb-6 min-h-[48px]">
                {hasDiscount ? (
                    <>
                        <p className="text-4xl font-bold text-primary">{formatPrice(displayDiscountPrice!)}</p>
                        <p className="text-2xl font-medium text-accent line-through">{formatPrice(displayPrice!)}</p>
                    </>
                ) : (
                   displayPrice !== undefined && <p className="text-4xl font-bold text-primary">{formatPrice(displayPrice)}</p>
                )}
            </div>

            <p className="text-muted-foreground leading-relaxed mb-8 break-words whitespace-pre-wrap" dir={descDir} style={descStyle}>{displayDescription}</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                    size="lg" 
                    onClick={handleAddToCart}
                    disabled={product.variantsEnabled && !selectedVariant}
                    className="flex-grow"
                >
                    <ShoppingCart className="me-2 h-5 w-5" />
                    {product.variantsEnabled && !selectedVariant ? 'Select Options' : t('add_to_cart').text}
                </Button>
            </div>
        </div>
      </div>
      </>
  );
}
