
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
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const isLoading = isUserLoading || isProfileLoading;

  useEffect(() => {
    // Only perform redirection logic after all loading is complete.
    if (!isLoading) {
      // If there's no user or the user's role is not 'admin', redirect.
      if (!user || userProfile?.role !== 'admin') {
        router.push('/login');
      }
    }
  }, [isLoading, user, userProfile, router]);

  // While loading, or if the user is not a confirmed admin yet, show the loader.
  // This prevents rendering children or redirecting prematurely.
  if (isLoading || !user || userProfile?.role !== 'admin') {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  // If all checks pass (not loading, user exists, and is an admin), render the children.
  return <>{children}</>;
}
