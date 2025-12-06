
'use client';

import Link from 'next/link';
import { Theater, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserNav } from '@/components/auth/user-nav';
import { CartIcon } from '@/components/cart/cart-icon';
import { LanguageSwitcher } from '../language/language-switcher';
import { ClientOnly } from './client-only';
import siteSettings from '@/../appData/siteSettings.json';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { PageLoader } from './page-loader';

export function Header() {
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isNavigating) {
      setIsNavigating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (pathname !== href) {
        setIsNavigating(true);
        router.push(href);
    }
  };


  return (
    <>
      {isNavigating && <PageLoader />}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          {/* Left side - Logo */}
          <Link href="/" className="flex items-center space-x-2" onClick={(e) => handleLinkClick(e, '/')}>
            {siteSettings.logoUrl ? (
              <Image src={siteSettings.logoUrl} alt={siteSettings.siteName} width={32} height={32} className="h-8 w-auto" />
            ) : (
              <Theater className="h-6 w-6 text-primary" />
            )}
            <span className="font-bold sm:inline-block font-headline h-6">
              {siteSettings.siteName}
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
    </>
  );
}
