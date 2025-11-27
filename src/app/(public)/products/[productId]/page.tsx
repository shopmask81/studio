'use client';

import { useParams, useRouter } from 'next/navigation';
import { ProductDetails } from '@/components/products/product-details';
import { Product } from '@/lib/types';
import { useMemo, useEffect, useState } from 'react';
import { ProductGrid } from '@/components/products/product-grid';
import { Separator } from '@/components/ui/separator';
import { useProductCache } from '@/components/products/product-cache-provider';
import { Loader2 } from 'lucide-react';

export default function ProductPage() {
  const params = useParams();
  const productId = params.productId as string;
  const router = useRouter();

  const { products: allProducts, isLoading: isCacheLoading, findProductById } = useProductCache();

  const product = useMemo(() => findProductById(productId), [findProductById, productId]);

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!isCacheLoading && allProducts.length > 0 && product) {
      const filtered = allProducts
        .filter(
          (p) =>
            p.category === product.category &&
            p.id !== product.id &&
            p.active === true
        )
        .slice(0, 3);
      setRelatedProducts(filtered);
    }
  }, [isCacheLoading, allProducts, product]);
  
  if (isCacheLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If cache is loaded but product not found, it might be a stale link. Redirect.
  if (!isCacheLoading && !product) {
      router.push('/');
      return null;
  }

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
                    isLoading={false} // Related products are derived from already loaded cache
                />
            </div>
        )}
    </div>
  );
}
