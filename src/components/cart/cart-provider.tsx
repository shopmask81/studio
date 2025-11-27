'use client';

import { createContext, useContext, useState, type ReactNode, useMemo, useEffect, useCallback } from 'react';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { collection, deleteDoc, doc, getDocs, writeBatch, setDoc, updateDoc } from 'firebase/firestore';
import { useTranslation } from '../language/language-provider';
import { useProductCache } from '../products/product-cache-provider';

type AddToCartOptions = {
  color?: string | null;
  size?: string | null;
}

// Stored in localStorage and Firestore
type CartItemStorage = {
  productId: string;
  quantity: number;
  variant?: AddToCartOptions | null;
}

// Used within the application, with full product details
export type CartItem = {
  product: Product;
  quantity: number;
  variant: AddToCartOptions | null;
}

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: AddToCartOptions) => void;
  removeFromCart: (productId: string, variant?: AddToCartOptions) => void;
  updateQuantity: (productId: string, quantity: number, variant?: AddToCartOptions) => void;
  clearCart: () => void;
  isCartLoading: boolean;
  cartTotal: number;
  shippingTotal: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to create a unique ID for a cart item, including its variant
const getCartItemId = (productId: string, variant?: AddToCartOptions | null) => {
  if (!variant || (!variant.color && !variant.size)) return productId;
  const color = variant.color || '';
  const size = variant.size || '';
  return `${productId}_${color}_${size}`.toLowerCase().replace(/\s+/g, '-');
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const { t } = useTranslation();
  const { findProductById, isLoading: isProductsLoading } = useProductCache();
  
  const getCartCollectionRef = useCallback((userId: string) => {
    if (!firestore) return null;
    return collection(firestore, `users/${userId}/cart`);
  }, [firestore]);

  // Effect to load cart from storage and hydrate with full product details
  useEffect(() => {
    const loadAndHydrateCart = async () => {
      if (isProductsLoading) {
        // Wait for product cache to be ready
        return;
      }
      setIsCartLoading(true);
      
      let storedItems: CartItemStorage[] = [];
      
      if (user && firestore) {
        const cartColRef = getCartCollectionRef(user.uid);
        if (cartColRef) {
          try {
            const snapshot = await getDocs(cartColRef);
            storedItems = snapshot.docs.map(d => d.data() as CartItemStorage);
          } catch (error) {
            console.error("Failed to load cart from Firestore", error);
          }
        }
      } else {
        try {
          const savedCart = localStorage.getItem('maskshop-guest-cart');
          if (savedCart) {
            storedItems = JSON.parse(savedCart);
          }
        } catch (error) {
          console.error("Failed to parse cart from localStorage", error);
        }
      }

      // Hydrate stored items with full product data from cache
      const hydratedItems: CartItem[] = storedItems
        .map(item => {
          const product = findProductById(item.productId);
          if (product) {
            return {
              product,
              quantity: item.quantity,
              variant: item.variant || null,
            };
          }
          return null;
        })
        .filter((item): item is CartItem => item !== null);

      setCartItems(hydratedItems);
      setIsCartLoading(false);
    };

    loadAndHydrateCart();
  }, [user, firestore, getCartCollectionRef, isProductsLoading, findProductById]);
  
  const updateStorage = useCallback((newItems: CartItem[]) => {
      const itemsToStore: CartItemStorage[] = newItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          variant: item.variant,
      }));

      if (user && firestore) {
          const cartColRef = getCartCollectionRef(user.uid);
          if (cartColRef) {
              const batch = writeBatch(firestore);
              // First, delete all existing items for simplicity
              getDocs(cartColRef).then(snapshot => {
                  snapshot.docs.forEach(doc => batch.delete(doc.ref));
                  // Then, add all the new items
                  itemsToStore.forEach(item => {
                      const cartItemId = getCartItemId(item.productId, item.variant);
                      const docRef = doc(cartColRef, cartItemId);
                      batch.set(docRef, item);
                  });
                  batch.commit().catch(e => console.error("Error updating cart in Firestore:", e));
              });
          }
      } else {
          localStorage.setItem('maskshop-guest-cart', JSON.stringify(itemsToStore));
      }
  }, [user, firestore, getCartCollectionRef]);


  const addToCart = useCallback((product: Product, quantity: number = 1, variant?: AddToCartOptions) => {
    setCartItems((prevItems) => {
      const cartItemId = getCartItemId(product.id, variant);
      const findPredicate = (item: CartItem) => getCartItemId(item.product.id, item.variant) === cartItemId;

      const existingItem = prevItems.find(findPredicate);
      let newItems: CartItem[];

      if (existingItem) {
        newItems = prevItems.map((item) =>
          findPredicate(item) ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        newItems = [...prevItems, { 
          product, 
          quantity, 
          variant: variant ? { color: variant.color || null, size: variant.size || null } : null,
        }];
      }
      
      updateStorage(newItems);
      return newItems;
    });

    toast({
      title: t('added_to_cart_title').text,
      description: t('added_to_cart_desc', { productName: product.name }).text,
    });
  }, [updateStorage, toast, t]);


  const removeFromCart = useCallback((productId: string, variant?: AddToCartOptions) => {
    setCartItems((prevItems) => {
      const cartItemId = getCartItemId(productId, variant);
      const newItems = prevItems.filter(item => getCartItemId(item.product.id, item.variant) !== cartItemId);
      updateStorage(newItems);
      return newItems;
    });
  }, [updateStorage]);

  const updateQuantity = useCallback((productId: string, quantity: number, variant?: AddToCartOptions) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant);
      return;
    }
    setCartItems((prevItems) => {
      const cartItemId = getCartItemId(productId, variant);
      const findPredicate = (item: CartItem) => getCartItemId(item.product.id, item.variant) === cartItemId;
      
      const newItems = prevItems.map((item) => (findPredicate(item) ? { ...item, quantity } : item));
      
      updateStorage(newItems);
      return newItems;
    });
  }, [removeFromCart, updateStorage]);

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
        let price = item.product.price;
        if (item.product.variantsEnabled && item.variant) {
            const variantDetail = item.product.variants?.find(v => 
                (item.product.variantOptions?.colors?.length ? v.color === item.variant?.color : true) &&
                (item.product.variantOptions?.sizes?.length ? v.size === item.variant?.size : true)
            );
            if (variantDetail) {
                price = variantDetail.discountPrice ?? variantDetail.price;
            }
        } else if (item.product.discountPrice) {
            price = item.product.discountPrice;
        }
        return total + price * item.quantity;
    }, 0);
  }, [cartItems]);
  
  const shippingTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const itemShipping = item.product.shippingPrice ?? 0;
      return total + itemShipping;
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
    isCartLoading: isCartLoading || isProductsLoading,
    cartTotal,
    shippingTotal,
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
