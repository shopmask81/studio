'use client';

import { createContext, useContext, useState, type ReactNode, useMemo, useEffect, useCallback } from 'react';
import type { CartItem, Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';

const LOCAL_STORAGE_CART_KEY = 'maskshop-guest-cart';

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  syncAndClearLocalCart: (userId: string) => Promise<void>;
  loadCartFromFirestore: (userId: string) => Promise<void>;
  saveCartToLocalStorage: () => Promise<void>;
  isCartLoading: boolean;
  cartTotal: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  // Load local cart on mount if no user
  useEffect(() => {
    if (!user) {
      try {
        const savedCart = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error("Failed to parse cart from localStorage", error);
        localStorage.removeItem(LOCAL_STORAGE_CART_KEY);
      } finally {
        setIsCartLoading(false);
      }
    }
  }, [user]);

  const getCartCollectionRef = useCallback((userId: string) => {
    if (!firestore) return null;
    return collection(firestore, `users/${userId}/cart`);
  }, [firestore]);
  

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    const isUserLoggedIn = !!user;

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      let newItems: CartItem[];

      if (existingItem) {
        newItems = prevItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        newItems = [...prevItems, { product, quantity }];
      }

      if (isUserLoggedIn && firestore) {
        const cartItemRef = doc(firestore, `users/${user.uid}/cart`, product.id);
        const itemData = newItems.find(i => i.product.id === product.id);
        if (itemData) {
          setDocumentNonBlocking(cartItemRef, { 
            ...itemData.product, 
            quantity: itemData.quantity 
          }, { merge: true });
        }
      } else {
        localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(newItems));
      }
      
      return newItems;
    });

    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  }, [user, firestore, toast]);

  const removeFromCart = useCallback((productId: string) => {
    const isUserLoggedIn = !!user;
    
    setCartItems((prevItems) => {
        const newItems = prevItems.filter((item) => item.product.id !== productId);

        if (isUserLoggedIn && firestore) {
            const cartItemRef = doc(firestore, `users/${user.uid}/cart`, productId);
            deleteDocumentNonBlocking(cartItemRef);
        } else {
            localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(newItems));
        }
        return newItems;
    });
  }, [user, firestore]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const isUserLoggedIn = !!user;

    setCartItems((prevItems) => {
        const newItems = prevItems.map((item) => (item.product.id === productId ? { ...item, quantity } : item));
        
        if (isUserLoggedIn && firestore) {
            const cartItemRef = doc(firestore, `users/${user.uid}/cart`, productId);
            updateDocumentNonBlocking(cartItemRef, { quantity });
        } else {
            localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(newItems));
        }
        return newItems;
    });
  }, [user, firestore, removeFromCart]);

  const clearCart = useCallback(() => {
    const isUserLoggedIn = !!user;
    if (isUserLoggedIn && firestore) {
        const cartColRef = getCartCollectionRef(user.uid);
        if (cartColRef) {
            getDocs(cartColRef).then(snapshot => {
                const batch = writeBatch(firestore);
                snapshot.docs.forEach(d => batch.delete(d.ref));
                batch.commit();
            });
        }
    } else {
        localStorage.removeItem(LOCAL_STORAGE_CART_KEY);
    }
    setCartItems([]);
  }, [user, firestore, getCartCollectionRef]);

  const syncAndClearLocalCart = useCallback(async (userId: string) => {
    if (!firestore) return;
    const localCartRaw = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
    if (!localCartRaw) return;

    const localItems: CartItem[] = JSON.parse(localCartRaw);
    if (localItems.length === 0) return;
    
    const cartColRef = getCartCollectionRef(userId);
    if(!cartColRef) return;
    
    const batch = writeBatch(firestore);
    localItems.forEach(item => {
        const docRef = doc(cartColRef, item.product.id);
        batch.set(docRef, { ...item.product, quantity: item.quantity }, { merge: true });
    });

    await batch.commit();
    localStorage.removeItem(LOCAL_STORAGE_CART_KEY);
  }, [firestore, getCartCollectionRef]);
  
  const loadCartFromFirestore = useCallback(async (userId: string) => {
    const cartColRef = getCartCollectionRef(userId);
    if (!cartColRef) return;

    setIsCartLoading(true);
    try {
        const snapshot = await getDocs(cartColRef);
        const firestoreItems: CartItem[] = snapshot.docs.map(d => ({
            product: d.data() as Product,
            quantity: d.data().quantity
        }));
        setCartItems(firestoreItems);
    } catch (error) {
        console.error("Failed to load cart from Firestore", error);
        toast({
            variant: "destructive",
            title: "Could not load cart",
            description: "There was an issue fetching your saved cart."
        })
    } finally {
        setIsCartLoading(false);
    }
  }, [getCartCollectionRef, toast]);
  
  const saveCartToLocalStorage = useCallback(async () => {
    if (cartItems.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(cartItems));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_CART_KEY);
    }
    // After saving, we can clear the state for the next user.
    setCartItems([]);
  }, [cartItems]);


  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
        const price = item.product.discountPrice ?? item.product.price;
        return total + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const itemCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    syncAndClearLocalCart,
    loadCartFromFirestore,
    saveCartToLocalStorage,
    isCartLoading,
    cartTotal,
    itemCount,
  };
  
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// These are needed for the non-blocking updates, so we re-export them here
// to avoid circular dependencies if we were to import them from another file.
function setDocumentNonBlocking(docRef: any, data: any, options: any) {
    setDoc(docRef, data, options).catch(error => console.error("setDoc failed", error));
}
function deleteDocumentNonBlocking(docRef: any) {
    deleteDoc(docRef).catch(error => console.error("deleteDoc failed", error));
}
function updateDocumentNonBlocking(docRef: any, data: any) {
    updateDoc(docRef, data).catch(error => console.error("updateDoc failed", error));
}
