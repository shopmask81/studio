'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { doc } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';

export function AffiliateRoute({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const isLoading = isUserLoading || isProfileLoading;
  const isAffiliate = userProfile?.role === 'affiliate';

  useEffect(() => {
    if (!isLoading && !isAffiliate) {
      router.push('/');
    }
  }, [isLoading, isAffiliate, router]);

  if (isLoading || !isAffiliate) {
    return (
        <div className="container mx-auto px-4 py-12">
            <div className="space-y-4">
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-48 w-full md:w-2/3" />
            </div>
        </div>
    );
  }

  return <>{children}</>;
}
