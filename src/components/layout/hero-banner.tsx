
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Autoplay from 'embla-carousel-autoplay';
import { useFirestore } from '@/firebase';
import type { Banner } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { getActiveBanners } from '@/firebase/queries/getBanners';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';

const CACHE_KEY = 'bannersCache';
const TIMESTAMP_KEY = 'bannersCacheTimestamp';
const VERSION_KEY = 'banners-version';
const CACHE_EXPIRATION_MS = 12 * 60 * 60 * 1000; // 12 hours

// Helper to convert ISO strings back to Timestamps for type consistency
const parseBanners = (banners: any[]): Banner[] => {
  return banners.map(b => ({
    ...b,
    createdAt: typeof b.createdAt === 'string' ? Timestamp.fromDate(new Date(b.createdAt)) : b.createdAt,
    updatedAt: typeof b.updatedAt === 'string' ? Timestamp.fromDate(new Date(b.updatedAt)) : b.updatedAt,
  }));
}

export function HeroBanner() {
  const plugin = React.useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  const firestore = useFirestore();
  const { toast } = useToast();

  const [banners, setBanners] = React.useState<Banner[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const fetchBanners = React.useCallback(async (forceRefetch = false) => {
    if (!firestore) return;
    setIsLoading(true);

    try {
        const cachedDataJSON = localStorage.getItem(CACHE_KEY);
        const lastUpdated = localStorage.getItem(TIMESTAMP_KEY);
        const now = Date.now();

        const isExpired = !lastUpdated || (now - Number(lastUpdated) > CACHE_EXPIRATION_MS);

        if (cachedDataJSON && !isExpired && !forceRefetch) {
            console.log('Loading banners from localStorage cache.');
            const parsed = JSON.parse(cachedDataJSON);
            setBanners(parseBanners(parsed));
        } else {
            console.log(forceRefetch ? 'Forced refetch triggered.' : 'Cache missing or expired. Fetching fresh banners.');
            const fetchedBanners = await getActiveBanners(firestore);
            setBanners(fetchedBanners);
            
            // The `createdAt` and `updatedAt` might be Timestamps. Convert to string for localStorage.
            const serializableBanners = fetchedBanners.map(b => {
                const createdAtString = typeof b.createdAt === 'string' ? b.createdAt : (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate().toISOString() : new Date().toISOString();
                const updatedAtString = typeof b.updatedAt === 'string' ? b.updatedAt : (b.updatedAt as any)?.toDate ? (b.updatedAt as any).toDate().toISOString() : new Date().toISOString();
                return {
                    ...b,
                    createdAt: createdAtString,
                    updatedAt: updatedAtString,
                }
            });
            
            localStorage.setItem(CACHE_KEY, JSON.stringify(serializableBanners));
            localStorage.setItem(TIMESTAMP_KEY, now.toString());
        }
    } catch (error) {
        console.error("Failed to fetch active banners:", error);
        toast({
            variant: 'destructive',
            title: 'Could not load banners',
            description: (error as Error).message,
        });
    } finally {
        setIsLoading(false);
    }
  }, [firestore, toast]);
  

  React.useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Effect to listen for storage events to update banners in real-time
  React.useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // If the 'banners-version' key changes, it means an admin updated the cache.
      if (event.key === VERSION_KEY) {
        console.log('New banner version detected. Refetching banners...');
        // Force a refetch, bypassing the normal cache expiration check.
        fetchBanners(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchBanners]);


  if (isLoading) {
    return (
      <div className="w-full aspect-[4/3] md:aspect-[16/7]">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!banners || banners.length === 0) {
    return (
        <div className="w-full aspect-video bg-muted/50 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
                <p>Banners will be displayed here.</p>
            </div>
        </div>
    );
  }

  return (
    <div className={cn("w-full group/hero", banners.length <= 1 && "pointer-events-none")}>
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {banners.map((banner, index) => (
            <CarouselItem key={banner.id}>
              <div className="p-0">
                <Card className="border-none rounded-none shadow-none">
                  <CardContent className="relative flex aspect-[4/3] md:aspect-[16/7] items-center justify-center p-0">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title || 'Promotional Banner'}
                      fill
                      priority={index === 0}
                      className="object-cover object-center brightness-75"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 z-10 bg-black/30">
                      <div className="text-center flex flex-col items-center justify-center max-w-3xl mx-auto px-4">
                        {banner.title && (
                          <h2 className="text-4xl md:text-6xl font-bold font-headline text-shadow-glow leading-tight text-center">
                            {banner.title}
                          </h2>
                        )}
                        {banner.description && (
                          <p className="mt-4 text-lg md:text-xl text-center text-white/90">
                              {banner.description}
                          </p>
                        )}
                        {banner.targetUrl && banner.cta && (
                          <Button asChild className="mt-6" size="lg">
                            <Link href={banner.targetUrl}>{banner.cta}</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {banners.length > 1 && (
            <>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white opacity-0 group-hover/hero:opacity-100 transition-opacity" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white opacity-0 group-hover/hero:opacity-100 transition-opacity" />
            </>
        )}
      </Carousel>
    </div>
  );
}
