
'use client';

import { User, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useAuth } from '@/firebase/provider';

export interface UserAuthHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

/**
 * A simplified hook to get the current Firebase user.
 * It acts as a direct wrapper around Firebase's onAuthStateChanged listener,
 * making Firebase the single source of truth for auth state.
 */
export const useUser = (): UserAuthHookResult => {
    const auth = useAuth();
    // Initialize state from auth.currentUser to handle sync cases, but know it might be null initially
    const [user, setUser] = useState<User | null>(() => auth?.currentUser ?? null);
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [userError, setUserError] = useState<Error | null>(null);

    useEffect(() => {
        if (!auth) {
            setIsUserLoading(false);
            setUserError(new Error("Auth service not available."));
            return;
        }

        // The onAuthStateChanged listener is the single source of truth.
        // It provides the user object when logged in, and null when logged out.
        const unsubscribe = onAuthStateChanged(
            auth,
            (firebaseUser) => {
                setUser(firebaseUser);
                setIsUserLoading(false);
                setUserError(null);
            },
            (error) => {
                console.error("useUser: onAuthStateChanged error:", error);
                setUser(null);
                setIsUserLoading(false);
                setUserError(error);
            }
        );

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [auth]);

    return { user, isUserLoading, userError };
};
