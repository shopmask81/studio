
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
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Category } from '@/lib/types';

const CACHE_KEY = 'categoriesCache';
const TIMESTAMP_KEY = 'categoriesCacheTimestamp';
const VERSION_KEY = 'categories-version';
const CACHE_EXPIRATION_MS = 12 * 60 * 60 * 1000; // 12 hours

type CachedCategories = {
  categories: Category[];
  lastUpdated: any;
};

type CategoryCacheContextType = {
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
};

const CategoryCacheContext = createContext<CategoryCacheContextType | undefined>(
  undefined
);

// Helper to convert ISO strings back to Timestamps for type consistency
const parseCategories = (categories: any[]): Category[] => {
  return categories.map(c => ({
    ...c,
    createdAt: typeof c.createdAt === 'string' ? Timestamp.fromDate(new Date(c.createdAt)) : c.createdAt,
    updatedAt: typeof c.updatedAt === 'string' ? Timestamp.fromDate(new Date(c.updatedAt)) : c.updatedAt,
  }));
}


export function CategoryCacheProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const firestore = useFirestore();

  const fetchAndCacheCategories = useCallback(async (forceRefetch = false) => {
    if (!firestore) {
      setError(new Error('Firestore not available.'));
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const cachedJSON = localStorage.getItem(CACHE_KEY);
      const lastUpdated = localStorage.getItem(TIMESTAMP_KEY);
      const now = Date.now();
      const isExpired = !lastUpdated || (now - Number(lastUpdated) > CACHE_EXPIRATION_MS);

      if (cachedJSON && !isExpired && !forceRefetch) {
          console.log('Loading categories from localStorage cache.');
          setCategories(parseCategories(JSON.parse(cachedJSON)));
      } else {
          console.log(forceRefetch ? 'Forced refetch of categories triggered.' : 'Category cache missing or expired. Fetching fresh data.');
          
          const cacheRef = doc(firestore, 'cachedData', 'allCategories');
          const docSnap = await getDoc(cacheRef);

          if (docSnap.exists()) {
            const data = docSnap.data() as CachedCategories;
            const fetchedCategories = data.categories || [];
            
            setCategories(parseCategories(fetchedCategories));
            localStorage.setItem(CACHE_KEY, JSON.stringify(fetchedCategories));
            localStorage.setItem(TIMESTAMP_KEY, now.toString());
            console.log(`Cached ${fetchedCategories.length} categories to localStorage.`);
          } else {
            throw new Error('Cache document "allCategories" not found in Firestore.');
          }
      }
    } catch (err: any) {
      console.error('Failed to fetch and cache categories:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [firestore]);


  useEffect(() => {
    fetchAndCacheCategories();
  }, [fetchAndCacheCategories]);

  // Listen for storage events to force a refresh
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === VERSION_KEY) {
        fetchAndCacheCategories(true); // Force refetch
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchAndCacheCategories]);

  const value = {
    categories,
    isLoading,
    error,
  };

  return (
    <CategoryCacheContext.Provider value={value}>
      {children}
    </CategoryCacheContext.Provider>
  );
}

export const useCategoryCache = () => {
  const context = useContext(CategoryCacheContext);
  if (context === undefined) {
    throw new Error('useCategoryCache must be used within a CategoryCacheProvider');
  }
  return context;
};
