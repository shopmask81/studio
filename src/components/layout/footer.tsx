
'use client';

import { Theater } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../auth/auth-provider";
import { useTranslation } from "../language/language-provider";
import siteSettings from '@/../appData/siteSettings.json';
import Image from 'next/image';
import { useState, useEffect } from "react";


export function Footer() {
  const { userProfile } = useAuth();
  const { t } = useTranslation();
  const [copyrightText, setCopyrightText] = useState('');

  const isAffiliate = userProfile?.role === 'affiliate' || userProfile?.role === 'admin';
  
  useEffect(() => {
    // This code runs only on the client, after hydration
    const currentYear = new Date().getFullYear();
    const dynamicCopyrightText = t('copyright_text').text.replace('{year}', currentYear.toString()).replace('{siteName}', siteSettings.siteName);
    setCopyrightText(dynamicCopyrightText);
  }, [t]);


  return (
    <footer className="border-t mt-16 bg-card/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center text-center gap-6">
          
          <Link href="/" className="flex items-center space-x-2">
            {siteSettings.logoUrl ? (
              <Image src={siteSettings.logoUrl} alt={siteSettings.siteName} width={32} height={32} className="h-8 w-auto" />
            ) : (
              <Theater className="h-6 w-6 text-primary" />
            )}
            <span className="font-bold font-headline text-lg">{siteSettings.siteName}</span>
          </Link>

          <nav className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">{t('about').text}</Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">{t('contact').text}</Link>
            {isAffiliate && (
                <Link href="/affiliate" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">{t('affiliate').text}</Link>
            )}
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">{t('terms_of_use').text}</Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">{t('privacy_policy').text}</Link>
          </nav>

          <div className="text-sm text-muted-foreground mt-4 h-5">
            {copyrightText}
          </div>
        </div>
      </div>
    </footer>
  );
}
