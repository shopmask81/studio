'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import type { Product } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminSettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCaching, setIsCaching] = useState(false);

  /**
   * Fetches all products, transforms them, and saves them to a single
   * cache document in Firestore. This operation runs entirely on the client.
   */
  const updateProductCache = async () => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Firestore not available',
        description: 'Please try again later.',
      });
      return;
    }

    setIsCaching(true);

    try {
      // 1. Fetch all products from the 'products' collection
      const productsCollectionRef = collection(firestore, 'products');
      const productSnapshot = await getDocs(productsCollectionRef);
      const allProducts = productSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Product)
      );

      // 2. Convert each product to a clean JSON object
      const productsForCache = allProducts.map((product) => ({
        id: product.id,
        name: product.name,
        name_ar: product.name_ar,
        description: product.description,
        description_ar: product.description_ar,
        price: product.price,
        discountPrice: product.discountPrice ?? null,
        shippingPrice: product.shippingPrice ?? 0,
        category: product.category,
        featured: product.featured ?? false,
        mainImage: product.mainImage,
        images: product.images ?? [],
        variantsEnabled: product.variantsEnabled ?? false,
        variants: product.variants ?? [],
        variantOptions: product.variantOptions ?? { colors: [], sizes: [] },
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));

      // 3. Get a reference to the target cache document
      const cacheDocRef = doc(firestore, 'cachedData', 'allProducts');

      // 4. Save the data, overwriting any existing content
      await setDoc(cacheDocRef, {
        products: productsForCache,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Cache Updated Successfully',
        description: `Cached ${productsForCache.length} products.`,
      });
    } catch (error: any) {
      console.error('Failed to update product cache:', error);
      toast({
        variant: 'destructive',
        title: 'Cache Update Failed',
        description:
          error.message || 'An unknown error occurred. Check the console.',
      });
    } finally {
      setIsCaching(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Product Cache Management</CardTitle>
          <CardDescription>
            Manually trigger a refresh of the public product cache. This fetches
            all products and stores them in a single document for faster public
            reads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>How it Works</AlertTitle>
            <AlertDescription>
              This client-side action reads all documents from the `products`
              collection and writes them into a single document located at
              `cachedData/allProducts`. This can be useful for improving public
              load times but should be used thoughtfully to avoid high read
              costs if you have thousands of products.
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button onClick={updateProductCache} disabled={isCaching}>
              {isCaching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {isCaching ? 'Caching...' : 'Refresh Product Cache'}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Manage Shop Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section is under construction. Soon you'll be able to manage
            general store settings here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
