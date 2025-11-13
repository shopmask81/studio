

'use client';
import { ProductGrid } from '@/components/products/product-grid';
import { Suspense } from 'react';
import { useTranslation } from '@/components/language/language-provider';
import { ClientOnly } from '@/components/layout/client-only';

export default function Home() {
  const { t } = useTranslation();
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
      
      <Suspense fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>
            <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>
            <div className="w-full h-96 bg-muted rounded-lg animate-pulse"></div>
        </div>
      }>
        <ProductGrid />
      </Suspense>
    </div>
  );
}
