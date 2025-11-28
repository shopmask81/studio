
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until loading is false before checking for user
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // If auth state is loading, or if the user is null (and redirect is imminent),
  // show a loading skeleton. This prevents children from rendering prematurely.
  if (isLoading || !user) {
    return (
        <div className="container mx-auto px-4 py-12">
            <div className="space-y-4">
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-48 w-full md:w-2/3" />
            </div>
        </div>
    );
  }

  // Only render children if loading is complete and user is authenticated.
  return <>{children}</>;
}
