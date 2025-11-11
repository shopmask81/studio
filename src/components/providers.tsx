'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { CartProvider } from '@/components/cart/cart-provider';
import { useUser } from '@/firebase';
import { Skeleton } from './ui/skeleton';

function AppBootstrapper({ children }: { children: React.ReactNode }) {
    const { isUserLoading } = useUser();

    if (isUserLoading) {
        return (
            <div className="flex flex-col min-h-screen">
                <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container flex h-14 items-center">
                        <div className="mr-4 flex items-center gap-2">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                        <div className="flex flex-1 items-center justify-end space-x-2">
                            <Skeleton className="w-9 h-9 rounded-full" />
                            <Skeleton className="w-9 h-9 rounded-full" />
                            <Skeleton className="w-24 h-9 rounded-md" />
                        </div>
                    </div>
                </header>
                <main className="flex-grow">
                    {children}
                </main>
            </div>
        )
    }

    return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="maskshop-theme">
        <CartProvider>
            <AppBootstrapper>{children}</AppBootstrapper>
        </CartProvider>
    </ThemeProvider>
  );
}
