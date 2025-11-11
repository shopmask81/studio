'use client';
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/products/product-card";
import { Product } from "@/lib/types";

// This component fetches product details for the wishlist
function WishlistProducts({ productIds }: { productIds: string[] }) {
    const firestore = useFirestore();
    const productsQuery = useMemoFirebase(() => {
        if (!firestore || productIds.length === 0) return null;
        const productRefs = productIds.map(id => collection(firestore, 'products'));
        // Firestore doesn't have a great way to query a list of documents by ID from different collections or a top-level query.
        // A real-world scenario would likely involve a more complex data model or multiple individual `useDoc` calls.
        // For this prototype, we'll fetch all products and filter client-side, which is NOT efficient for production.
        return collection(firestore, 'products');
    }, [firestore, productIds]);

    const { data: products, isLoading } = useCollection<Product>(productsQuery);

    const wishlistedProducts = products?.filter(p => productIds.includes(p.id));

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>
                <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>
                <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>
            </div>
        )
    }

    if (!wishlistedProducts || wishlistedProducts.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlistedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    )
}


export default function WishlistPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const wishlistQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, `users/${user.uid}/wishlists`);
    }, [firestore, user]);

    const { data: wishlistItems, isLoading } = useCollection(wishlistQuery);
    
    const productIds = wishlistItems?.map(item => item.id) ?? [];
    const hasItems = productIds.length > 0;

    return (
        <ProtectedRoute>
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-headline mb-8">Your Wishlist</h1>
                {isLoading ? (
                     <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : hasItems ? (
                    <WishlistProducts productIds={productIds} />
                ) : (
                    <Card className="text-center border-2 border-dashed rounded-lg p-12">
                        <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-semibold mb-2">Your Wishlist is Empty</h2>
                        <p className="text-muted-foreground mb-6">Looks like you haven't added any masks to your wishlist yet.</p>
                        <Button asChild>
                            <Link href="/">Start Exploring</Link>
                        </Button>
                    </Card>
                )}
            </div>
        </ProtectedRoute>
    );
}
