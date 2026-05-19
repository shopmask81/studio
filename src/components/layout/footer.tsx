
'use client';

import { Theater } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "../language/language-provider";
import siteSettings from '@/../appData/siteSettings.json';
import Image from 'next/image';
import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PageLoader } from "./page-loader";
import { ClientOnly } from "./client-only";

export function Footer() {
  const { t, language } = useTranslation();
  const [copyrightText, setCopyrightText] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This code runs only on the client, after hydration
    const currentYear = new Date().getFullYear();
    const dynamicCopyrightText = t('copyright_text').text
      .replace('{year}', currentYear.toString())
      .replace('{siteName}', siteSettings.siteName);
    setCopyrightText(dynamicCopyrightText);
  }, [t, language]);

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

  const navLinks = useMemo(() => {
    const links = [
      { href: '/about', label: t('about').text },
      { href: '/contact', label: t('contact').text },
      { href: '/affiliate', label: t('affiliate').text, isAffiliate: true },
      { href: '/terms', label: t('terms_of_use').text },
      { href: '/privacy', label: t('privacy_policy').text },
    ];

    // Filter out the affiliate link if the setting is enabled
    if ((siteSettings as any).hideAffiliateLink) {
        return links.filter(link => !link.isAffiliate);
    }
    
    return links;
  }, [t]);

  return (
    <>
      {isNavigating && <PageLoader />}
      <footer className="border-t mt-16 bg-card/50 min-h-[12rem]">
        <div className="container mx-auto px-4 py-8">
          <ClientOnly>
            <div className="flex flex-col items-center text-center gap-6">
              
              <Link href="/" className="flex items-center space-x-2" onClick={(e) => handleLinkClick(e, '/')}>
                {siteSettings.logoUrl ? (
                  <Image src={siteSettings.logoUrl} alt={siteSettings.siteName} width={32} height={32} className="h-8 w-auto" />
                ) : (
                  <Theater className="h-6 w-6 text-primary" />
                )}
                <span className="font-bold font-headline text-lg">{siteSettings.siteName}</span>
              </Link>

              <nav className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
                {navLinks.map(link => (
                   <Link 
                    key={link.href}
                    href={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide"
                    onClick={(e) => handleLinkClick(e, link.href)}
                  >
                    {link.label}
                   </Link>
                ))}
              </nav>

              <div className="text-sm text-muted-foreground mt-4 h-5">
                {copyrightText}
              </div>
            </div>
          </ClientOnly>
        </div>
      </footer>
    </>
  );
}
