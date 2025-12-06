
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useCart } from '../cart/cart-provider';
import { cn } from '@/lib/utils';
import { useTranslation } from '../language/language-provider';
import { useCurrency } from '../currency/currency-provider';

interface SelectVariantModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product;
}

export function SelectVariantModal({ isOpen, onOpenChange, product }: SelectVariantModalProps) {
  const { addToCart } = useCart();
  const { t, language } = useTranslation();
  const { formatPrice } = useCurrency();

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedColor(product.variantOptions?.colors?.[0] || null);
      setSelectedSize(product.variantOptions?.sizes?.[0] || null);
    }
  }, [isOpen, product]);
  
  const selectedVariant = useMemo(() => {
    if (!product.variantsEnabled || !product.variants || (!selectedColor && !selectedSize)) return null;
    return product.variants.find(v => 
        (!v.color || v.color === selectedColor) &&
        (!v.size || v.size === selectedSize)
    );
  }, [product, selectedColor, selectedSize]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, 1, { color: selectedColor, size: selectedSize });
      onOpenChange(false);
    }
  };

  const displayName = (language === 'ar' && product.name_ar) || product.name;
  const { dir, style } = t(displayName);
  
  const isAddToCartDisabled = product.variantsEnabled && !selectedVariant;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl flex flex-col p-0 max-h-[90vh]">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle className="text-2xl font-headline" dir={dir} style={style}>
            {displayName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="relative aspect-square w-full rounded-lg overflow-hidden self-start">
                <Image src={product.mainImage} alt={product.name} fill className="object-cover" />
              </div>
              <div className="flex flex-col gap-4">
                  {product.variantOptions?.colors && product.variantOptions.colors.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Color: <span className="text-muted-foreground font-normal">{selectedColor}</span></Label>
                      <RadioGroup value={selectedColor || undefined} onValueChange={setSelectedColor} className="flex flex-wrap gap-2">
                        {product.variantOptions.colors.map(color => (
                          <RadioGroupItem key={color} value={color} id={`modal-color-${color}`} className="sr-only" />
                        ))}
                        {product.variantOptions.colors.map(color => (
                          <Label key={`label-${color}`} htmlFor={`modal-color-${color}`} className={cn("cursor-pointer rounded-md border-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted", selectedColor === color ? "border-primary bg-primary/10" : "border-border")}>
                            {color}
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>
                  )}
                  {product.variantOptions?.sizes && product.variantOptions.sizes.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Size: <span className="text-muted-foreground font-normal">{selectedSize}</span></Label>
                      <RadioGroup value={selectedSize || undefined} onValueChange={setSelectedSize} className="flex flex-wrap gap-2">
                        {product.variantOptions.sizes.map(size => (
                          <RadioGroupItem key={size} value={size} id={`modal-size-${size}`} className="sr-only" />
                        ))}
                        {product.variantOptions.sizes.map(size => (
                          <Label key={`label-${size}`} htmlFor={`modal-size-${size}`} className={cn("cursor-pointer rounded-md border-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted", selectedSize === size ? "border-primary bg-primary/10" : "border-border")}>
                            {size}
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  <div className="pt-4 space-y-2">
                    <div className="flex items-baseline gap-3 min-h-[40px]">
                      {selectedVariant ? (
                        <>
                          {(selectedVariant.discountPrice && selectedVariant.discountPrice < selectedVariant.price) ? (
                              <>
                                  <p className="text-3xl font-bold text-primary">{formatPrice(selectedVariant.discountPrice)}</p>
                                  <p className="text-xl font-medium text-muted-foreground line-through">{formatPrice(selectedVariant.price)}</p>
                              </>
                          ) : (
                              <p className="text-3xl font-bold text-primary">{formatPrice(selectedVariant.price)}</p>
                          )}
                        </>
                      ) : product.variantsEnabled ? (
                          <p className="text-muted-foreground">Select options to see price</p>
                      ) : (
                        <p className="text-3xl font-bold text-primary">{formatPrice(product.price)}</p>
                      )}
                    </div>
                    <div>
                      {selectedVariant ? (
                          selectedVariant.stock > 0 ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">In Stock</Badge>
                          ) : (
                              <Badge variant="destructive">Out of Stock</Badge>
                          )
                      ) : product.variantsEnabled ? (
                          <p className="text-sm text-muted-foreground h-6"></p>
                      ) : (
                        product.stock > 0 ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">In Stock</Badge>
                        ) : (
                            <Badge variant="destructive">Out of Stock</Badge>
                        )
                      )}
                    </div>
                  </div>
              </div>
            </div>
        </div>
        
        <DialogFooter className="p-6 pt-4 border-t shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleAddToCart} disabled={isAddToCartDisabled}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
