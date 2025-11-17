
'use client';
import { ProductGrid } from '@/components/products/product-grid';
import { Suspense, useMemo, useState } from 'react';
import { useTranslation } from '@/components/language/language-provider';
import { ClientOnly } from '@/components/layout/client-only';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Product } from '@/lib/types';
import { collection } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

export default function Home() {
  const { t } = useTranslation();
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  const { data: allProducts, isLoading } = useCollection<Product>(productsQuery);

  const filteredProducts = useMemo(() => {
    if (!allProducts) {
      return [];
    }
    if (!debouncedSearchQuery.trim()) {
      return allProducts;
    }

    const query = debouncedSearchQuery.toLowerCase().trim();

    return allProducts.filter(product => {
      const check = (field: any) => String(field ?? '').toLowerCase().includes(query);

      return (
        check(product.name) ||
        check(product.name_ar) ||
        check(product.description) ||
        check(product.description_ar) ||
        check(product.category)
      );
    });
  }, [allProducts, debouncedSearchQuery]);

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
        <ClientOnly>
            <header className="text-center mb-12">
                <h1 className="font-headline text-4xl md:text-6xl font-bold mb-4" {...t('discover_persona')}>
                {t('discover_persona').text}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto" {...t('explore_collection')}>
                {t('explore_collection').text}
                </p>
            </header>
        </ClientOnly>
      
        <div className="mb-8 max-w-lg mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search masks by name, description, category..."
            className="w-full pl-10 h-12 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

      <Suspense fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>
            <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>
            <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>
        </div>
      }>
        <ProductGrid products={filteredProducts} isLoading={isLoading} />
      </Suspense>
    </div>
  );
}
