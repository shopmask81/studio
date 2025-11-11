'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { ProductCard } from './product-card';
import { collection } from 'firebase/firestore';
import { Product } from '@/lib/types';

export function ProductGrid() {
  const firestore = useFirestore();
  
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  const { data: products, isLoading } = useCollection<Product>(productsQuery);

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
    return <div className="text-center text-muted-foreground">No products available at the moment.</div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {products?.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
