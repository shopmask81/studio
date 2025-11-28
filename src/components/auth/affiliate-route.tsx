'use client';

import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from './auth-provider';
import { useEffect } from 'react';

export function AffiliateRoute({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isLoading } = useAuth();
  const router = useRouter();

  const isAffiliate = userProfile?.role === 'affiliate' || userProfile?.role === 'admin';

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isAffiliate) {
        router.push('/account');
      }
    }
  }, [isLoading, user, isAffiliate, router]);

  if (isLoading || !user || !isAffiliate) {
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
