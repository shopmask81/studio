'use client';
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, deleteDoc, doc } from "firebase/firestore";
import { Heart, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { Product, WishlistItem } from "@/lib/types";
import Image from "next/image";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/hooks/use-toast";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

function WishlistItemCard({ item }: { item: WishlistItem }) {
    const { addToCart } = useCart();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    // We need to fetch the full product to add to cart
    const productRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'products', item.productId);
    }, [firestore, item.productId]);

    const { data: product } = useDoc<Product>(productRef);

    const handleAddToCart = () => {
        if (product) {
            addToCart(product);
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not add product to cart. Product details not found."
            })
        }
    }

    const handleRemove = () => {
        if (!user || !firestore) return;
        const wishlistItemRef = doc(firestore, `users/${user.uid}/wishlists`, item.productId);
        deleteDocumentNonBlocking(wishlistItemRef);
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
                        alt={item.productName}
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
                <Button onClick={handleAddToCart} className="w-full" disabled={!product}>
                    {!product ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <ShoppingCart className="h-4 w-4 mr-2" />}
                    Add to Cart
                </Button>
                <Button variant="outline" size="icon" onClick={handleRemove}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function WishlistPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const wishlistQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, `users/${user.uid}/wishlists`);
    }, [firestore, user]);

    const { data: wishlistItems, isLoading, error } = useCollection<WishlistItem>(wishlistQuery);
    
    const hasItems = wishlistItems && wishlistItems.length > 0;

    return (
        <ProtectedRoute>
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-headline mb-8">Your Wishlist</h1>
                {isLoading ? (
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
                        <h2 className="text-2xl font-semibold mb-2">Your Wishlist is Empty</h2>
                        <p className="text-muted-foreground mb-6">Start exploring our handmade products to find something you love!</p>
                        <Button asChild>
                            <Link href="/">Start Exploring</Link>
                        </Button>
                    </Card>
                )}
            </div>
        </ProtectedRoute>
    );
}
