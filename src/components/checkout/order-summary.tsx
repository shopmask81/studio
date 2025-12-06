
'use client';

import Image from 'next/image';
import { useCart } from '../cart/cart-provider';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { useTranslation } from '../language/language-provider';
import { Badge } from '../ui/badge';
import { useCurrency } from '../currency/currency-provider';

export function OrderSummary() {
  const { cartItems, cartTotal, shippingTotal } = useCart();
  const { t, language } = useTranslation();
  const { formatPrice } = useCurrency();
  const total = cartTotal + shippingTotal;

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle {...t('order_summary')}>{t('order_summary').text}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cartItems.map((item) => {
            let price: number;
            if (item.product.variantsEnabled && item.variant) {
                const variantDetail = item.product.variants?.find(v => 
                    (item.product.variantOptions?.colors?.length ? v.color === item.variant?.color : true) &&
                    (item.product.variantOptions?.sizes?.length ? v.size === item.variant?.size : true)
                );
                price = variantDetail?.discountPrice ?? variantDetail?.price ?? item.product.price;
            } else {
                price = item.product.discountPrice ?? item.product.price;
            }

            const displayName = (language === 'ar' && item.product.name_ar) || item.product.name;
            const { dir } = t(displayName);
            return (
                <div key={item.product.id + (item.variant?.color || '') + (item.variant?.size || '')} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-md overflow-hidden border">
                            <Image src={item.product.mainImage} alt={item.product.name} fill className="object-cover" />
                             <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                {item.quantity}
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="font-medium truncate max-w-[150px]" dir={dir}>{displayName}</p>
                             {item.variant && (item.variant.color || item.variant.size) && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    {item.variant.color && <span>{item.variant.color}</span>}
                                    {item.variant.color && item.variant.size && <span>/</span>}
                                    {item.variant.size && <span>{item.variant.size}</span>}
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="font-medium">{formatPrice(price * item.quantity)}</p>
                </div>
            )
          })}
        </div>
        
        <Separator className="my-4" />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span {...t('subtotal')}>{t('subtotal').text}</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span {...t('shipping')}>{t('shipping').text}</span>
            <span>{shippingTotal > 0 ? formatPrice(shippingTotal) : 'Free'}</span>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between font-bold text-lg">
          <span {...t('total')}>{t('total').text}</span>
          <span>{formatPrice(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
