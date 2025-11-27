'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';

const CACHE_KEY = 'productsCache';
const TIMESTAMP_KEY = 'productsCacheUpdated';
const CACHE_EXPIRATION_MS = 72 * 60 * 60 * 1000; // 72 hours

type CachedProducts = {
  products: Product[];
  updatedAt: any;
};

type ProductCacheContextType = {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  findProductById: (id: string) => Product | undefined;
};

const ProductCacheContext = createContext<ProductCacheContextType | undefined>(
  undefined
);

export function ProductCacheProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const fetchAndCacheProducts = useCallback(async () => {
    if (!firestore) {
      setError(new Error('Firestore not available.'));
      setIsLoading(false);
      return;
    }

    console.log('Fetching products from Firestore...');
    setIsLoading(true);
    setError(null);

    try {
      const cacheRef = doc(firestore, 'cachedData', 'allProducts');
      const docSnap = await getDoc(cacheRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as CachedProducts;
        const fetchedProducts = data.products || [];
        setProducts(fetchedProducts);
        localStorage.setItem(CACHE_KEY, JSON.stringify(fetchedProducts));
        localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
        console.log(`Cached ${fetchedProducts.length} products to localStorage.`);
      } else {
        throw new Error('Cache document "allProducts" not found in Firestore.');
      }
    } catch (err: any) {
      console.error('Failed to fetch and cache products:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [firestore]);

  useEffect(() => {
    const loadProducts = () => {
      try {
        const cachedProductsJSON = localStorage.getItem(CACHE_KEY);
        const lastUpdated = localStorage.getItem(TIMESTAMP_KEY);
        const now = Date.now();

        if (cachedProductsJSON && lastUpdated && now - Number(lastUpdated) < CACHE_EXPIRATION_MS) {
          console.log('Loading products from localStorage cache.');
          setProducts(JSON.parse(cachedProductsJSON));
          setIsLoading(false);
        } else {
          // Cache is expired or doesn't exist, trigger fetch.
          // On non-homepage routes, this will lead to a redirect if cache is necessary.
          if (pathname === '/') {
             fetchAndCacheProducts();
          } else {
             // For other pages, if cache is needed but absent, they should handle it
             // (e.g., by redirecting or showing a specific state). We just set loading to false.
             setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Failed to load products from localStorage:', err);
        setProducts([]);
        // If localStorage fails, attempt a fresh fetch on the homepage
        if (pathname === '/') {
          fetchAndCacheProducts();
        } else {
          setIsLoading(false);
        }
      }
    };

    loadProducts();
  }, [fetchAndCacheProducts, pathname]);

  const findProductById = useCallback(
    (id: string) => {
      return products.find((p) => p.id === id);
    },
    [products]
  );
  
  // Handle redirects for pages that absolutely require the cache
  useEffect(() => {
      // If we are not on the homepage, and the products are not loaded yet (after the initial attempt),
      // and there's no error, it implies a direct navigation to a deep page with an empty/expired cache.
      // We redirect to the homepage to force the cache to populate.
      if (pathname !== '/' && !isLoading && products.length === 0 && !error) {
          console.log("Redirecting to homepage to populate cache...");
          router.push('/');
      }
  }, [pathname, isLoading, products, error, router]);

  const value = {
    products,
    isLoading,
    error,
    findProductById,
  };

  return (
    <ProductCacheContext.Provider value={value}>
      {children}
    </ProductCacheContext.Provider>
  );
}

export const useProductCache = () => {
  const context = useContext(ProductCacheContext);
  if (context === undefined) {
    throw new Error('useProductCache must be used within a ProductCacheProvider');
  }
  return context;
};
