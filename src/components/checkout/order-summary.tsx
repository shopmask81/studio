'use client';

import Image from 'next/image';
import { useCart } from '../cart/cart-provider';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';

export function OrderSummary() {
  const { cartItems, cartTotal } = useCart();
  const shippingCost = 5.00;
  const total = cartTotal + shippingCost;

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cartItems.map((item) => {
            const price = item.product.discountPrice ?? item.product.price;
            return (
                <div key={item.product.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-md overflow-hidden border">
                            <Image src={item.product.mainImage} alt={item.product.name} fill className="object-cover" />
                             <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                {item.quantity}
                            </span>
                        </div>
                        <div>
                            <p className="font-medium truncate max-w-[150px]">{item.product.name}</p>
                            <p className="text-muted-foreground">${price.toFixed(2)}</p>
                        </div>
                    </div>
                    <p className="font-medium">${(price * item.quantity).toFixed(2)}</p>
                </div>
            )
          })}
        </div>
        
        <Separator className="my-4" />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span>${shippingCost.toFixed(2)}</span>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
