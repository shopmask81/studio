'use client';
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, query, where } from "firebase/firestore";
import { Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/products/product-card";
import { Product } from "@/lib/types";

function WishlistedProduct({ productId }: { productId: string }) {
    const firestore = useFirestore();
    const productRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'products', productId);
    }, [firestore, productId]);

    const { data: product, isLoading } = useDoc<Product>(productRef);

    if (isLoading) {
        return <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>;
    }

    if (!product) {
        return null;
    }

    return <ProductCard product={product} />;
}


// This component fetches product details for the wishlist
function WishlistProducts({ productIds }: { productIds: string[] }) {
    if (productIds.length === 0) {
        return null;
    }
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {productIds.map(productId => (
                <WishlistedProduct key={productId} productId={productId} />
            ))}
        </div>
    )
}


export default function WishlistPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const wishlistQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        // The wishlist documents are stored with the product ID as the document ID
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
