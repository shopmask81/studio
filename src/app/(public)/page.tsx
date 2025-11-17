'use client';
import { ProductGrid } from '@/components/products/product-grid';
import { Suspense, useMemo, useState } from 'react';
import { useTranslation } from '@/components/language/language-provider';
import { ClientOnly } from '@/components/layout/client-only';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Category, Product } from '@/lib/types';
import { collection } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Menu, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { CategoryDrawer } from '@/components/products/category-drawer';
import { HeroBanner } from '@/components/layout/hero-banner';

export default function Home() {
  const { t } = useTranslation();
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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

    let products = allProducts;

    // Filter by category
    if (selectedCategory) {
      products = products.filter(product => product.category === selectedCategory.name);
    }

    // Filter by search query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      products = products.filter(product => {
        const check = (field: any) => String(field ?? '').toLowerCase().includes(query);

        return (
          check(product.name) ||
          check(product.name_ar) ||
          check(product.description) ||
          check(product.description_ar) ||
          check(product.category)
        );
      });
    }

    return products;
  }, [allProducts, debouncedSearchQuery, selectedCategory]);

  return (
    <>
      <HeroBanner />
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
        
          <div className="mb-8 max-w-2xl mx-auto flex items-center gap-2">
              <CategoryDrawer
                  isOpen={isDrawerOpen}
                  onOpenChange={setIsDrawerOpen}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
              />
               <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 flex-shrink-0"
                  onClick={() => setIsDrawerOpen(true)}
                  aria-label="Open categories menu"
              >
                  <Menu className="h-6 w-6" />
              </Button>
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={
                      selectedCategory
                      ? `Search in ${selectedCategory.name}...`
                      : 'Search masks by name, description, category...'
                  }
                  className="w-full pl-10 h-12 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
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
    </>
  );
}
