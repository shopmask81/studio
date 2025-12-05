
'use client';

import Link from 'next/link';
import { Theater } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserNav } from '@/components/auth/user-nav';
import { CartIcon } from '@/components/cart/cart-icon';
import { LanguageSwitcher } from '../language/language-switcher';
import { ClientOnly } from './client-only';
import siteSettings from '@/../appData/siteSettings.json';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export function Header() {
  const [currentSiteName, setCurrentSiteName] = useState(siteSettings.siteName);

  useEffect(() => {
    // On the client, after hydration, ensure we have the latest site name.
    // This is a simplified approach. In a real-world app, you might fetch this
    // or use a more robust state management solution that's hydration-safe.
    setCurrentSiteName(siteSettings.siteName);
  }, []);


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between" suppressHydrationWarning>
        {/* Left side - Logo */}
        <Link href="/" className="flex items-center space-x-2" suppressHydrationWarning>
          {siteSettings.logoUrl ? (
            <Image src={siteSettings.logoUrl} alt={currentSiteName} width={32} height={32} className="h-8 w-auto" />
          ) : (
            <Theater className="h-6 w-6 text-primary" />
          )}
          <span className="font-bold sm:inline-block font-headline">
            {currentSiteName}
          </span>
        </Link>
        
        {/* Right side - Icons */}
        <ClientOnly>
          <div className="flex items-center gap-0">
            <UserNav />
            <ThemeToggle />
            <LanguageSwitcher />
            <CartIcon />
          </div>
        </ClientOnly>
      </div>
    </header>
  );
}
