
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const userDocRef = useMemoFirebase(() => {
    // Wait until we have a user to create the document reference
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  // isProfileLoading will be true until userDocRef is created and the doc is fetched
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const isLoading = isUserLoading || isProfileLoading;
  const isConfirmedAdmin = user && userProfile?.role === 'admin';

  useEffect(() => {
    // This effect should only handle redirection logic, and only when loading is complete.
    // If we are still loading any data, we should wait.
    if (isLoading) {
      return; // Do nothing while loading
    }

    // After loading, if the user is not a confirmed admin, redirect.
    if (!isConfirmedAdmin) {
      router.push('/login');
    }
  }, [isLoading, isConfirmedAdmin, router]);

  // While any authentication or data fetching is in progress, show the loader.
  // This is the key change: we check for loading *before* checking for admin status.
  // We also ensure we don't render children prematurely until the admin status is confirmed.
  if (isLoading || !isConfirmedAdmin) {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  // If all checks pass (not loading, user exists, and is a confirmed admin), render the children.
  return <>{children}</>;
}
