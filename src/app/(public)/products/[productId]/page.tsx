
'use client';

import { useParams } from 'next/navigation';
import { ProductDetails } from '@/components/products/product-details';
import { useDoc, useFirestore } from '@/firebase';
import { doc, getDocs, collection } from 'firebase/firestore';
import { Product } from '@/lib/types';
import { useMemo, useEffect, useState } from 'react';
import { ProductGrid } from '@/components/products/product-grid';
import { Separator } from '@/components/ui/separator';

export default function ProductPage() {
  const params = useParams();
  const productId = params.productId as string;
  const firestore = useFirestore();

  const productRef = useMemo(() => {
    if (!firestore || !productId) return null;
    return doc(firestore, 'products', productId);
  }, [firestore, productId]);

  const { data: product, isLoading: isProductLoading } = useDoc<Product>(productRef);

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!firestore || !product || !product.category) {
        setIsLoadingRelated(false);
        return;
      }

      setIsLoadingRelated(true);
      try {
        const cacheRef = doc(firestore, 'cachedData', 'allProducts');
        const cacheSnap = await getDocs(collection(firestore, 'cachedData'));
        const cacheDoc = cacheSnap.docs[0];

        if (cacheDoc?.exists()) {
          const allProducts = cacheDoc.data().products as Product[];
          const filtered = allProducts
            .filter(
              (p) =>
                p.category === product.category && // Match category
                p.id !== product.id && // Exclude the current product
                p.active === true // Only show active products
            )
            .slice(0, 3); // Limit to 3 related products
          setRelatedProducts(filtered);
        }
      } catch (e) {
        console.error("Failed to fetch related products from cache", e);
      } finally {
        setIsLoadingRelated(false);
      }
    };

    fetchRelatedProducts();
  }, [firestore, product]);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
        <ProductDetails productId={productId} />
        {relatedProducts.length > 0 && (
            <div className="mt-16 md:mt-24">
                <Separator />
                <h2 className="text-3xl font-headline font-bold text-center my-12">
                    You Might Also Like
                </h2>
                <ProductGrid
                    products={relatedProducts}
                    isLoading={isLoadingRelated}
                />
            </div>
        )}
    </div>
  );
}
