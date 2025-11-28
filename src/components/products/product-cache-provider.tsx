
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from 'react';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


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

  useEffect(() => {
    const fetchAndCacheProducts = async () => {
      if (!firestore) {
        setError(new Error('Firestore not available.'));
        setIsLoading(false);
        return;
      }

      console.log('Fetching products from Firestore to warm cache...');
      setIsLoading(true);
      setError(null);
      
      const cacheRef = doc(firestore, 'cachedData', 'allProducts');

      try {
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
        // This is the new, more specific error handling block.
        if (err.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: cacheRef.path,
                operation: 'get',
            });
            setError(permissionError);
            // Globally emit the rich error for the listener to catch.
            errorEmitter.emit('permission-error', permissionError);
        } else {
            console.error('Failed to fetch and cache products:', err);
            setError(err);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    const loadProducts = () => {
      try {
        const cachedProductsJSON = localStorage.getItem(CACHE_KEY);
        const lastUpdated = localStorage.getItem(TIMESTAMP_KEY);
        const now = Date.now();
        
        const isExpired = !lastUpdated || (now - Number(lastUpdated) > CACHE_EXPIRATION_MS);

        if (cachedProductsJSON && !isExpired) {
          console.log('Loading products from localStorage cache.');
          setProducts(JSON.parse(cachedProductsJSON));
          setIsLoading(false);
        } else {
          // Cache is missing or expired, fetch from Firestore.
          fetchAndCacheProducts();
        }
      } catch (err) {
        console.error('Failed to load products from localStorage, fetching fresh:', err);
        fetchAndCacheProducts();
      }
    };

    loadProducts();
  }, [firestore]);


  const findProductById = useCallback(
    (id: string) => {
      return products.find((p) => p.id === id);
    },
    [products]
  );
  

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
