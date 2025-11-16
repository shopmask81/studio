
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect when loading is complete
    if (!isLoading) {
      if (!user) {
        // If no user, redirect to login
        router.push('/login');
      } else if (userProfile?.role !== 'admin') {
        // If user is not an admin, redirect to homepage
        router.push('/');
      }
    }
  }, [user, userProfile, isLoading, router]);

  // While loading auth state OR if the user profile is not loaded yet, show a full-screen spinner.
  // This is the key change: it waits for BOTH auth and profile.
  if (isLoading || !userProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is complete and user is an admin, render the children
  if (user && userProfile.role === 'admin') {
    return <>{children}</>;
  }

  // If checks fail after loading, show a loader while the redirect initiated by useEffect is in progress.
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
