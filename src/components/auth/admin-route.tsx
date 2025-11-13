
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
    // Wait for the user to be loaded before creating the ref
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  // Combine loading states: still loading if auth is checking, or if we have a user but are still fetching their profile.
  const isLoading = isUserLoading || (user && isProfileLoading);
  const isDefinitelyNotAdmin = !isLoading && (!user || userProfile?.role !== 'admin');

  useEffect(() => {
    // Only redirect when we are certain the user is not an admin.
    if (isDefinitelyNotAdmin) {
      router.push('/login');
    }
  }, [isDefinitelyNotAdmin, router]);

  // While loading, or if the user is not an admin (and is about to be redirected), show a loader.
  // This prevents rendering the children prematurely or showing a blank screen.
  if (isLoading || isDefinitelyNotAdmin) {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  // If we're here, it means isLoading is false and isDefinitelyNotAdmin is false,
  // so the user is a confirmed admin.
  return <>{children}</>;
}
