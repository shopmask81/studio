
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Autoplay from 'embla-carousel-autoplay';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
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

export function HeroBanner() {
  const plugin = React.useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  const firestore = useFirestore();

  const bannersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'banners'),
      where('active', '==', true),
      orderBy('order', 'asc')
    );
  }, [firestore]);

  const { data: banners, isLoading } = useCollection<Banner>(bannersQuery);

  if (isLoading) {
    return (
      <div className="w-full aspect-[16/7]">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!banners || banners.length === 0) {
    return null; // Don't render anything if there are no active banners
  }

  return (
    <div className="w-full">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="p-0">
                <Card className="border-none rounded-none shadow-none">
                  <CardContent className="relative flex aspect-[16/7] items-center justify-center p-0">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title}
                      fill
                      priority={banners.indexOf(banner) === 0}
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
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white" />
      </Carousel>
    </div>
  );
}
