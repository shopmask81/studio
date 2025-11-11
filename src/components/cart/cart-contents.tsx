'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useCart } from './cart-provider';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { useRouter } from 'next/navigation';

export function CartContents() {
    const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal, itemCount } = useCart();
    const router = useRouter();

    const handleCheckout = () => {
        router.push('/checkout');
    };

    if (itemCount === 0) {
        return (
            <Card className="text-center border-2 border-dashed rounded-lg p-12">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Your Cart is Empty</h2>
                <p className="text-muted-foreground mb-6">Add some handmade crafts to your cart to see them here.</p>
                <Button asChild>
                    <Link href="/">Continue Shopping</Link>
                </Button>
            </Card>
        );
    }

    return (
        <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Your Items</CardTitle>
                         <Button variant="outline" size="sm" onClick={clearCart}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear Cart
                        </Button>
                    </CardHeader>
                    <CardContent className="divide-y">
                        {cartItems.map(item => {
                            const hasDiscount = item.product.discountPrice && item.product.discountPrice < item.product.price;
                            const price = hasDiscount ? item.product.discountPrice! : item.product.price;
                            return (
                                <div key={item.product.id} className="flex items-start sm:items-center gap-4 py-4 flex-col sm:flex-row">
                                    <div className="relative h-24 w-20 flex-shrink-0 rounded-md overflow-hidden">
                                         <Image src={item.product.mainImage} alt={item.product.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-semibold">{item.product.name}</h3>
                                        <div className="flex items-baseline gap-2 text-sm">
                                            {hasDiscount ? (
                                                <>
                                                    <p className="text-primary font-semibold">${price.toFixed(2)}</p>
                                                    <p className="text-muted-foreground line-through">${item.product.price.toFixed(2)}</p>
                                                </>
                                            ) : (
                                                <p className="text-primary">${price.toFixed(2)}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-10 text-center font-medium">{item.quantity}</span>
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="font-semibold w-20 text-right text-base">${(price * item.quantity).toFixed(2)}</p>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => removeFromCart(item.product.id)}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>
            <div>
                <Card className="sticky top-20">
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Shipping</span>
                            <span>$5.00</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-4 border-t">
                            <span>Total</span>
                            <span>${(cartTotal + 5).toFixed(2)}</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button className="w-full" onClick={handleCheckout}>Proceed to Checkout</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
