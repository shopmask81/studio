'use client';
import { ProductGrid } from '@/components/products/product-grid';
import { Suspense, useMemo, useState } from 'react';
import { useTranslation } from '@/components/language/language-provider';
import { ClientOnly } from '@/components/layout/client-only';
import { Category, Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Menu, Search, AlertCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { CategoryDrawer } from '@/components/products/category-drawer';
import { HeroBanner } from '@/components/layout/hero-banner';
import { useProductCache } from '@/components/products/product-cache-provider';
import DOMPurify from 'isomorphic-dompurify';

export function HomePageContent() {
  const { t, language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch products from the global cache provider
  const { products: allProducts, isLoading, error } = useProductCache();
  
  const filteredProducts = useMemo(() => {
    if (!allProducts) {
      return [];
    }

    let products = allProducts;

    // Filter by category
    if (selectedCategory) {
      products = products.filter(product => product.category === selectedCategory.slug);
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
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>
            <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>
            <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>
        </div>
      );
    }

    if (error) {
       return (
        <div className="text-center py-12 text-muted-foreground bg-muted/50 rounded-lg">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2 text-foreground">Failed to Load Products</h2>
          <p>There was an error fetching the product data. Please try again later.</p>
        </div>
      );
    }

    if (!allProducts || allProducts.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground bg-muted/50 rounded-lg">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2 text-foreground">Products Not Available</h2>
          <p>Products are not available right now. Please contact an administrator.</p>
        </div>
      );
    }
    
    return <ProductGrid products={filteredProducts} isLoading={isLoading} />;
  }

  const exploreText = language === 'ar' ? t('explore_collection_ar').text : t('explore_collection').text;
  const sanitizedExploreText = DOMPurify.sanitize(exploreText);
  const dir = language === 'ar' ? 'rtl' : 'ltr';


  return (
    <>
      <HeroBanner />
      <div className="container mx-auto px-4 py-8 md:py-16">
          <ClientOnly>
              <header className="text-center mb-12">
                  <h1 className="font-headline text-4xl md:text-6xl font-bold mb-4" {...t('discover_persona')}>
                  {t('discover_persona').text}
                  </h1>
                  <div
                    className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto prose dark:prose-invert"
                    dir={dir}
                    dangerouslySetInnerHTML={{ __html: sanitizedExploreText }}
                  />
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
                  className="h-12 w-12 flex-shrink-0 bg-white dark:bg-transparent border-[#C7B8A2] dark:border-input text-[#5A493A] dark:text-foreground shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-none"
                  onClick={() => setIsDrawerOpen(true)}
                  aria-label="Open categories menu"
              >
                  <Menu className="h-6 w-6" />
              </Button>
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5A493A] dark:text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={
                      selectedCategory
                      ? `Search in ${selectedCategory.name}...`
                      : 'Search masks by name, description, category...'
                  }
                  className="w-full pl-10 h-12 text-base bg-white dark:bg-background border-[#C7B8A2] dark:border-input text-[#5A493A] dark:text-foreground shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-none"
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
          {renderContent()}
        </Suspense>
      </div>
    </>
  );
}
