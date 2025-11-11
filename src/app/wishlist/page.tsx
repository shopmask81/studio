import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";
import Link from "next/link";

export default function WishlistPage() {
    // This is a placeholder. A real implementation would fetch wishlist from Firestore.
    const hasItems = false; 

    return (
        <ProtectedRoute>
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-headline mb-8">Your Wishlist</h1>
                {hasItems ? (
                    <div>
                        {/* Wishlist items would be rendered here */}
                    </div>
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
