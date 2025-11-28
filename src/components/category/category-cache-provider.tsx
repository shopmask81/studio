
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

const CACHE_KEY = 'cachedCategories';
const CACHE_EXPIRATION_MS = 12 * 60 * 60 * 1000; // 12 hours

type CachedData = {
  data: Category[];
  timestamp: number;
}

type FirestoreCacheDoc = {
  categories: Category[];
  lastUpdated: Timestamp;
}

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

  const fetchAndCacheCategories = useCallback(async () => {
    if (!firestore) {
      setError(new Error('Firestore not available.'));
      setIsLoading(false);
      return;
    }
    
    console.log('Category cache missing or expired. Fetching fresh data from Firestore.');
    setIsLoading(true);
    setError(null);
    
    try {
      const cacheRef = doc(firestore, 'cachedData', 'allCategories');
      const docSnap = await getDoc(cacheRef);

      if (docSnap.exists()) {
        const firestoreData = docSnap.data() as FirestoreCacheDoc;
        const fetchedCategories = firestoreData.categories || [];
        
        const newCache: CachedData = {
          data: fetchedCategories,
          timestamp: Date.now(),
        };
        
        setCategories(parseCategories(fetchedCategories));
        localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
        console.log(`Cached ${fetchedCategories.length} categories to localStorage.`);
      } else {
        throw new Error('Cache document "allCategories" not found in Firestore.');
      }
    } catch (err: any) {
      console.error('Failed to fetch and cache categories:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [firestore]);


  useEffect(() => {
    try {
      const cachedJSON = localStorage.getItem(CACHE_KEY);
      
      if (cachedJSON) {
        const cachedData: CachedData = JSON.parse(cachedJSON);
        const now = Date.now();
        const isExpired = now - cachedData.timestamp > CACHE_EXPIRATION_MS;

        if (!isExpired) {
          console.log('Loading categories from localStorage cache.');
          setCategories(parseCategories(cachedData.data));
          setIsLoading(false);
        } else {
          // Cache is expired, fetch fresh data
          fetchAndCacheCategories();
        }
      } else {
        // No cache found, fetch fresh data
        fetchAndCacheCategories();
      }
    } catch (error) {
      console.error("Error loading categories from localStorage", error);
      // If there's an error reading cache, fetch fresh data
      fetchAndCacheCategories();
    }
  }, [fetchAndCacheCategories]);

  // Listen for storage events from other tabs (e.g., admin updates cache)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // A specific key ('categories-version') signals an update from admin
      if (event.key === 'categories-version') {
        console.log('Category cache refresh triggered by another tab.');
        fetchAndCacheCategories(); // Force refetch
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
