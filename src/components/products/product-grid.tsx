
'use client';

import { ProductCard } from './product-card';
import { Product } from '@/lib/types';

interface ProductGridProps {
    products: Product[] | null;
    isLoading: boolean;
}

export function ProductGrid({ products, isLoading }: ProductGridProps) {

  if (isLoading) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>
            <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>
            <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>
        </div>
    )
  }

  if (!products || products.length === 0) {
    return <div className="text-center text-muted-foreground py-12">No products found matching your search.</div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {products?.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
