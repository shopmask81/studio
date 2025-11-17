'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Autoplay from 'embla-carousel-autoplay';

import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { banners } from '@/lib/banner-data';

export function HeroBanner() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

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
                      priority={banner.id === 'artisan-jewelry'}
                      className="object-cover object-center brightness-75"
                      data-ai-hint={banner.imageHint}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4 z-10 bg-black/30">
                        <h2 className="text-4xl md:text-6xl font-bold font-headline text-shadow-glow leading-tight">
                            {banner.title}
                        </h2>
                        <p className="mt-4 max-w-xl text-lg text-white/90">
                            {banner.description}
                        </p>
                        {banner.link && (
                            <Button asChild className="mt-6" size="lg">
                                <Link href={banner.link}>{banner.cta}</Link>
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
