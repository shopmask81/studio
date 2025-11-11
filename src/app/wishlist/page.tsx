'use client';
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Heart, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { Product, WishlistItem } from "@/lib/types";
import Image from "next/image";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/components/wishlist/wishlist-provider";
import { useDoc, useFirestore } from "@/firebase";
import { useMemo } from "react";
import { doc } from "firebase/firestore";
import { useTranslation } from "@/components/language/language-provider";

function WishlistItemCard({ item }: { item: WishlistItem }) {
    const { addToCart } = useCart();
    const { removeFromWishlist } = useWishlist();
    const { toast } = useToast();
    const firestore = useFirestore();
    const { t } = useTranslation();

    const productRef = useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, 'products', item.productId);
    }, [firestore, item.productId]);

    const { data: product, isLoading: isProductLoading } = useDoc<Product>(productRef);

    const handleAddToCart = () => {
        if (product) {
            addToCart(product);
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not add product to cart. Product details not yet loaded."
            })
        }
    }

    const handleRemove = () => {
        removeFromWishlist(item.productId);
        toast({
            title: "Removed from Wishlist",
            description: `${item.productName} has been removed.`,
        });
    }
    
    const price = item.price || 0;
    const imageUrl = item.productImage || 'https://picsum.photos/seed/placeholder/600/800';

    return (
        <Card className="overflow-hidden group">
            <Link href={`/products/${item.productId}`}>
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                    <Image
                        src={imageUrl}
                        alt={item.productName || 'Wishlisted product'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
            </Link>
            <CardContent className="p-4">
                <h3 className="font-headline text-xl mb-2 group-hover:text-primary transition-colors">{item.productName}</h3>
                <p className="font-bold text-accent">${price.toFixed(2)}</p>
            </CardContent>
            <CardFooter className="p-4 flex gap-2">
                <Button onClick={handleAddToCart} className="w-full" disabled={isProductLoading || !product}>
                    {isProductLoading ? <Loader2 className="h-4 w-4 me-2 animate-spin"/> : <ShoppingCart className="h-4 w-4 me-2" />}
                    {t('add_to_cart')}
                </Button>
                <Button variant="outline" size="icon" onClick={handleRemove}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function WishlistPage() {
    const { wishlistItems, isWishlistLoading, error } = useWishlist();
    const { t } = useTranslation();
    const hasItems = wishlistItems && wishlistItems.length > 0;

    return (
        <ProtectedRoute>
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-headline mb-8">{t('your_wishlist')}</h1>
                {isWishlistLoading ? (
                     <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : error ? (
                     <Card className="text-center border-2 border-dashed border-destructive/50 rounded-lg p-12">
                        <h2 className="text-2xl font-semibold mb-2 text-destructive">Error Loading Wishlist</h2>
                        <p className="text-muted-foreground mb-6">We couldn’t load your wishlist right now. Please try again later.</p>
                    </Card>
                ) : hasItems ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {wishlistItems.map(item => (
                            <WishlistItemCard key={item.productId} item={item} />
                        ))}
                    </div>
                ) : (
                    <Card className="text-center border-2 border-dashed rounded-lg p-12">
                        <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-semibold mb-2">{t('wishlist_is_empty')}</h2>
                        <p className="text-muted-foreground mb-6">{t('wishlist_is_empty_desc')}</p>
                        <Button asChild>
                            <Link href="/">{t('start_exploring')}</Link>
                        </Button>
                    </Card>
                )}
            </div>
        </ProtectedRoute>
    );
}
