
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
import { doc, getDoc, Timestamp } from 'firebase/firestore';

const CACHE_KEY = 'bannersCache';
const TIMESTAMP_KEY = 'bannersCacheUpdated';
const CACHE_EXPIRATION_MS = 72 * 60 * 60 * 1000; // 72 hours

type CachedBanners = {
  banners: Banner[];
  updatedAt: number; // Storing as milliseconds
};

export function HeroBanner() {
  const plugin = React.useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  const firestore = useFirestore();
  const { toast } = useToast();

  const [banners, setBanners] = React.useState<Banner[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchBanners = async () => {
      if (!firestore) return;
      setIsLoading(true);

      try {
        const cachedDataJSON = localStorage.getItem(CACHE_KEY);
        const lastUpdated = localStorage.getItem(TIMESTAMP_KEY);
        const now = Date.now();

        const isExpired = !lastUpdated || (now - Number(lastUpdated) > CACHE_EXPIRATION_MS);

        if (cachedDataJSON && !isExpired) {
          console.log('Loading banners from localStorage cache.');
          const cachedData: CachedBanners = JSON.parse(cachedDataJSON);
          // Firestore Timestamps are not plain JSON, so we need to convert them back
          const bannersWithTimestamps = cachedData.banners.map(b => ({
            ...b,
            createdAt: new Timestamp(b.createdAt.seconds, b.createdAt.nanoseconds),
            updatedAt: new Timestamp(b.updatedAt.seconds, b.updatedAt.nanoseconds),
          }));
          setBanners(bannersWithTimestamps);
          setIsLoading(false);
        } else {
          console.log('Cache missing or expired. Fetching fresh banners.');
          const fetchedBanners = await getActiveBanners(firestore);
          setBanners(fetchedBanners);
          
          // The fetchedBanners have Firestore Timestamps which are objects.
          // These are fine to be stored in component state but need to be serialized for localStorage.
          localStorage.setItem(CACHE_KEY, JSON.stringify({ banners: fetchedBanners }));
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
    };

    fetchBanners();
  }, [firestore, toast]);

  if (isLoading) {
    return (
      <div className="w-full aspect-[16/7]">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!banners || banners.length === 0) {
    return (
        <div className="w-full aspect-[16/7] bg-muted/50 flex items-center justify-center">
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
                  <CardContent className="relative flex aspect-[16/7] items-center justify-center p-0">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title}
                      fill
                      priority={index === 0}
                      className="object-cover object-center brightness-75"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4 z-10 bg-black/30">
                      <h2 className="text-4xl md:text-6xl font-bold font-headline text-shadow-glow leading-tight">
                        {banner.title}
                      </h2>
                      {banner.description && (
                         <p className="mt-4 max-w-xl text-lg text-white/90">
                            {banner.description}
                        </p>
                      )}
                      {banner.targetUrl && banner.cta && (
                        <Button asChild className="mt-6" size="lg">
                          <Link href={banner.targetUrl}>{banner.cta}</Link>
                        </Button>
                      )}
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
