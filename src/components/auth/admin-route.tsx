
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for the loading to finish before making a decision.
    if (!isLoading) {
      if (!user) {
        // If there's no authenticated user, redirect to login.
        router.push('/login');
      } else if (userProfile?.role !== 'admin') {
        // If the user is logged in but is not an admin, redirect to the homepage.
        router.push('/');
      }
    }
  }, [user, userProfile, isLoading, router]);

  // While AuthProvider is determining auth state and fetching the profile, show a loader.
  // This is the crucial part that prevents child components from rendering prematurely.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is complete, and the user is authenticated and has the admin role, render the children.
  if (user && userProfile?.role === 'admin') {
    return <>{children}</>;
  }

  // If checks fail after loading (e.g., role is not admin), show a loader while redirecting.
  // This prevents a brief flash of content or an empty page.
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
