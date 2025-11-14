
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from './cart-provider';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '../language/language-provider';

function CartDisplay() {
    const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal, itemCount } = useCart();
    const router = useRouter();
    const { toast } = useToast();
    const { t, language } = useTranslation();

    const handleCheckout = () => {
        router.push('/checkout');
    };

    const handleRemoveItem = (productId: string, productName: string, selectedColor?: string, selectedSize?: string) => {
        removeFromCart(productId, { selectedColor, selectedSize });
        const translatedName = t('item_removed_desc', { productName }).text;
        toast({
            title: t('item_removed_title').text,
            description: translatedName,
        });
    }

    if (itemCount === 0) {
        return (
            <Card className="text-center border-2 border-dashed rounded-lg p-12">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2" {...t('cart_is_empty')}>{t('cart_is_empty').text}</h2>
                <p className="text-muted-foreground mb-6" {...t('cart_is_empty_desc')}>{t('cart_is_empty_desc').text}</p>
                <Button asChild>
                    <Link href="/">{t('continue_shopping').text}</Link>
                </Button>
            </Card>
        );
    }

    return (
        <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle {...t('your_items')}>{t('your_items').text}</CardTitle>
                         <Button variant="outline" size="sm" onClick={clearCart}>
                            <Trash2 className="me-2 h-4 w-4" />
                            {t('clear_cart').text}
                        </Button>
                    </CardHeader>
                    <CardContent className="divide-y">
                        {cartItems.map(item => {
                            const hasDiscount = item.product.discountPrice && item.product.discountPrice < item.product.price;
                            const price = hasDiscount ? item.product.discountPrice! : item.product.price;
                            const displayName = (language === 'ar' && item.product.name_ar) || item.product.name;
                            const { dir } = t(displayName);

                            return (
                                <div key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`} className="flex items-start sm:items-center gap-4 py-4 flex-col sm:flex-row">
                                    <div className="relative h-24 w-20 flex-shrink-0 rounded-md overflow-hidden">
                                         <Image src={item.product.mainImage} alt={item.product.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-semibold" dir={dir}>{displayName}</h3>
                                        {(item.selectedColor || item.selectedSize) && (
                                            <p className="text-sm text-muted-foreground">
                                                {item.selectedColor}{item.selectedColor && item.selectedSize && ', '}{item.selectedSize}
                                            </p>
                                        )}
                                        <div className="text-sm">
                                            {hasDiscount ? (
                                                <div className="flex items-baseline gap-2">
                                                    <p className="text-primary font-semibold">${price.toFixed(2)}</p>
                                                    <p className="text-muted-foreground line-through">${item.product.price.toFixed(2)}</p>
                                                </div>
                                            ) : (
                                                <p className="text-primary">${price.toFixed(2)}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.quantity > 1 ? (
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity - 1, { selectedColor: item.selectedColor, selectedSize: item.selectedSize })}>
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => handleRemoveItem(item.product.id, displayName, item.selectedColor, item.selectedSize)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <span className="w-10 text-center font-medium">{item.quantity}</span>
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity + 1, { selectedColor: item.selectedColor, selectedSize: item.selectedSize })}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="font-semibold w-20 text-right text-base">${(price * item.quantity).toFixed(2)}</p>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>
            <div>
                <Card className="sticky top-20">
                    <CardHeader>
                        <CardTitle {...t('order_summary')}>{t('order_summary').text}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between text-muted-foreground">
                            <span {...t('subtotal')}>{t('subtotal').text}</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span {...t('shipping')}>{t('shipping').text}</span>
                            <span>$5.00</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-4 border-t">
                            <span {...t('total')}>{t('total').text}</span>
                            <span>${(cartTotal + 5).toFixed(2)}</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button className="w-full" onClick={handleCheckout}>{t('proceed_to_checkout').text}</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}


export function CartContents() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        // You can return a loading skeleton here
        return null;
    }

    return <CartDisplay />;
}
