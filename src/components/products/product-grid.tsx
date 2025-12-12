
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>
            <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>
            <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>
            <div className="w-full h-96 bg-muted rounded-lg animate-pulse hidden lg:block"></div>
            <div className="w-full h-96 bg-muted rounded-lg animate-pulse hidden xl:block"></div>
        </div>
    )
  }

  if (!products || products.length === 0) {
    return <div className="text-center text-muted-foreground py-12">No products found matching your search.</div>
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {products?.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
