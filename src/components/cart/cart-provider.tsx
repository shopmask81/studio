'use client';

import { createContext, useContext, useState, type ReactNode, useMemo, useEffect, useCallback } from 'react';
import type { CartItem, Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { collection, deleteDoc, doc, getDocs, writeBatch, setDoc, updateDoc } from 'firebase/firestore';
import { useTranslation } from '../language/language-provider';

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
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
  const { t } = useTranslation();
  
  const getCartCollectionRef = useCallback((userId: string) => {
    if (!firestore) return null;
    return collection(firestore, `users/${userId}/cart`);
  }, [firestore]);

  // This effect handles loading the cart from Firestore when a user is logged in,
  // or from localStorage if they are a guest.
  useEffect(() => {
    const loadCart = async () => {
      setIsCartLoading(true);
      if (user && firestore) {
        // User is logged in, load from Firestore
        const cartColRef = getCartCollectionRef(user.uid);
        if (cartColRef) {
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
                title: t('load_cart_failed_title').text,
                description: t('load_cart_failed_desc').text,
            })
          }
        }
      } else {
        // User is a guest, load from localStorage
        try {
          const savedCart = localStorage.getItem('maskshop-guest-cart');
          if (savedCart) {
            setCartItems(JSON.parse(savedCart));
          } else {
            setCartItems([]);
          }
        } catch (error) {
          console.error("Failed to parse cart from localStorage", error);
          setCartItems([]);
        }
      }
      setIsCartLoading(false);
    };
    loadCart();
  }, [user, firestore, getCartCollectionRef, toast, t]);
  

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
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

      if (user && firestore) {
        const cartItemRef = doc(firestore, `users/${user.uid}/cart`, product.id);
        const itemData = newItems.find(i => i.product.id === product.id);
        if (itemData) {
          setDoc(cartItemRef, { 
            ...itemData.product, 
            quantity: itemData.quantity 
          }, { merge: true }).catch(e => console.error("Error adding to cart in Firestore:", e));
        }
      } else {
        localStorage.setItem('maskshop-guest-cart', JSON.stringify(newItems));
      }
      
      return newItems;
    });

    toast({
      title: t('added_to_cart_title').text,
      description: t('added_to_cart_desc', { productName: product.name }).text,
    });
  }, [user, firestore, toast, t]);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems((prevItems) => {
        const newItems = prevItems.filter((item) => item.product.id !== productId);

        if (user && firestore) {
            const cartItemRef = doc(firestore, `users/${user.uid}/cart`, productId);
            deleteDoc(cartItemRef).catch(e => console.error("Error removing from cart in Firestore:", e));
        } else {
            localStorage.setItem('maskshop-guest-cart', JSON.stringify(newItems));
        }
        return newItems;
    });
  }, [user, firestore]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) => {
        const newItems = prevItems.map((item) => (item.product.id === productId ? { ...item, quantity } : item));
        
        if (user && firestore) {
            const cartItemRef = doc(firestore, `users/${user.uid}/cart`, productId);
            updateDoc(cartItemRef, { quantity }).catch(e => console.error("Error updating cart quantity in Firestore:", e));
        } else {
            localStorage.setItem('maskshop-guest-cart', JSON.stringify(newItems));
        }
        return newItems;
    });
  }, [user, firestore, removeFromCart]);

  const clearCart = useCallback(async () => {
    if (user && firestore) {
        const cartColRef = getCartCollectionRef(user.uid);
        if (cartColRef) {
            const snapshot = await getDocs(cartColRef);
            const batch = writeBatch(firestore);
            snapshot.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
        }
    } else {
        localStorage.removeItem('maskshop-guest-cart');
    }
    setCartItems([]);
  }, [user, firestore, getCartCollectionRef]);
  
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
