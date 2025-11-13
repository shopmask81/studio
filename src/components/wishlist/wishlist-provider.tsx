'use client';

import { createContext, useContext, useState, type ReactNode, useMemo, useEffect, useCallback } from 'react';
import type { WishlistItem } from '@/lib/types';
import { useUser, useFirestore } from '@/firebase';
import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

const LOCAL_STORAGE_WISHLIST_KEY = 'maskshop-guest-wishlist';

type WishlistContextType = {
  wishlistItems: WishlistItem[];
  addToWishlist: (item: Omit<WishlistItem, 'addedAt'>) => void;
  removeFromWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  loadWishlistFromFirestore: (userId: string) => Promise<void>;
  clearLocalWishlist: () => void;
  setWishlistItems: React.Dispatch<React.SetStateAction<WishlistItem[]>>;
  isWishlistLoading: boolean;
  wishlistItemCount: number;
  error: Error | null;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isWishlistLoading, setIsWishlistLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const getWishlistCollectionRef = useCallback((userId: string) => {
    if (!firestore) return null;
    return collection(firestore, `users/${userId}/wishlists`);
  }, [firestore]);

  // Effect for real-time updates when user is logged in
  useEffect(() => {
    if (user && firestore) {
      setIsWishlistLoading(true);
      const wishlistColRef = getWishlistCollectionRef(user.uid);
      if (!wishlistColRef) return;

      const unsubscribe = onSnapshot(wishlistColRef, 
        (snapshot) => {
          const items: WishlistItem[] = snapshot.docs.map(d => ({
            productId: d.id,
            ...d.data()
          } as WishlistItem));
          setWishlistItems(items);
          setIsWishlistLoading(false);
        },
        (err) => {
          console.error("Wishlist snapshot error:", err);
          setError(err);
          setIsWishlistLoading(false);
        }
      );

      return () => unsubscribe();
    } else if (!user) {
      // Handle guest user: load from localStorage on mount
      try {
        const localData = localStorage.getItem(LOCAL_STORAGE_WISHLIST_KEY);
        setWishlistItems(localData ? JSON.parse(localData) : []);
      } catch (e) {
        console.error("Failed to parse wishlist from localStorage", e);
        setWishlistItems([]);
      } finally {
        setIsWishlistLoading(false);
      }
    }
  }, [user, firestore, getWishlistCollectionRef]);


  const addToWishlist = useCallback((item: Omit<WishlistItem, 'addedAt'>) => {
    const fullItem: WishlistItem = { ...item, addedAt: new Date() as any };
    
    setWishlistItems(prev => {
        if (prev.some(i => i.productId === item.productId)) {
            return prev; // Already in list
        }
        const newItems = [...prev, fullItem];

        if (user && firestore) {
            const docRef = doc(firestore, `users/${user.uid}/wishlists`, item.productId);
            // Use serverTimestamp for Firestore
            setDoc(docRef, { ...item, addedAt: serverTimestamp() }).catch(e => console.error("Error adding to wishlist in Firestore:", e));
        } else {
            localStorage.setItem(LOCAL_STORAGE_WISHLIST_KEY, JSON.stringify(newItems));
        }
        return newItems;
    });
  }, [user, firestore]);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlistItems(prev => {
        const newItems = prev.filter(i => i.productId !== productId);
        if (user && firestore) {
            const docRef = doc(firestore, `users/${user.uid}/wishlists`, productId);
            deleteDoc(docRef).catch(e => console.error("Error removing from wishlist in Firestore:", e));
        } else {
            localStorage.setItem(LOCAL_STORAGE_WISHLIST_KEY, JSON.stringify(newItems));
        }
        return newItems;
    });
  }, [user, firestore]);
  
  const isWishlisted = useCallback((productId: string) => {
      return wishlistItems.some(item => item.productId === productId);
  }, [wishlistItems]);

  const loadWishlistFromFirestore = useCallback(async (userId: string) => {
    const wishlistColRef = getWishlistCollectionRef(userId);
    if (!wishlistColRef) return;

    setIsWishlistLoading(true);
    try {
        const snapshot = await getDocs(wishlistColRef);
        const firestoreItems: WishlistItem[] = snapshot.docs.map(d => d.data() as WishlistItem);
        setWishlistItems(firestoreItems);
    } catch (error) {
        console.error("Failed to load wishlist from Firestore", error);
    } finally {
        setIsWishlistLoading(false);
    }
  }, [getWishlistCollectionRef]);
  
  const clearLocalWishlist = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_WISHLIST_KEY);
  }, []);


  const wishlistItemCount = useMemo(() => wishlistItems.length, [wishlistItems]);
  
  const value = {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isWishlisted,
    loadWishlistFromFirestore,
    clearLocalWishlist,
    setWishlistItems,
    isWishlistLoading,
    wishlistItemCount,
    error,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
