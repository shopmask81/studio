'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@/firebase';
import { useCart } from '@/components/cart/cart-provider';
import { useWishlist } from '@/components/wishlist/wishlist-provider';
import { useToast } from './use-toast';
import { useTranslation } from '@/components/language/language-provider';

/**
 * An invisible component-hook that handles syncing local cart/wishlist
 * to Firestore upon login, and vice-versa on logout.
 */
export function AuthSync() {
  const { user, isUserLoading } = useUser();
  const { syncAndClearLocalCart, loadCartFromFirestore, saveCartToLocalStorage } = useCart();
  const { syncAndClearLocalWishlist, loadWishlistFromFirestore, saveWishlistToLocalStorage } = useWishlist();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const hasSyncedOnLogin = useRef(false);
  const hasSyncedOnLogout = useRef(false);

  useEffect(() => {
    // Don't run sync logic until auth state is resolved
    if (isUserLoading) {
      return;
    }

    if (user && !hasSyncedOnLogin.current) {
      // User has just logged in
      const syncOnLogin = async () => {
        try {
          await syncAndClearLocalCart(user.uid);
          await syncAndClearLocalWishlist(user.uid);
          
          // After syncing, load the now-merged data from Firestore
          await loadCartFromFirestore(user.uid);
          await loadWishlistFromFirestore(user.uid);

          toast({
            title: t('welcome_back_title').text,
            description: t('synced_items_desc').text,
          });
        } catch (error) {
          console.error("Error syncing local data to Firestore:", error);
           toast({
            variant: "destructive",
            title: t('sync_failed_title').text,
            description: t('sync_failed_desc').text,
          });
        }
      };
      
      syncOnLogin();
      hasSyncedOnLogin.current = true;
      hasSyncedOnLogout.current = false;
    } else if (!user && !hasSyncedOnLogout.current) {
      // User has just logged out
      const syncOnLogout = async () => {
        await saveCartToLocalStorage();
        await saveWishlistToLocalStorage();
      };

      syncOnLogout();
      hasSyncedOnLogout.current = true;
      hasSyncedOnLogin.current = false;
    }

  }, [user, isUserLoading, syncAndClearLocalCart, syncAndClearLocalWishlist, loadCartFromFirestore, loadWishlistFromFirestore, saveCartToLocalStorage, saveWishlistToLocalStorage, toast, t]);

  // This component does not render anything
  return null;
}
