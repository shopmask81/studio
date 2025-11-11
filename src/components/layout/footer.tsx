'use client';

import { Theater } from "lucide-react";
import Link from "next/link";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { useTranslation } from "../language/language-provider";


export function Footer() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { t } = useTranslation();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);
  const isAffiliate = user && userProfile?.role === 'affiliate';

  return (
    <footer className="border-t mt-16 bg-card/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center text-center gap-6">
          
          <div className="flex items-center space-x-2">
            <Theater className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline text-lg">MaskShop</span>
          </div>

          <nav className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">{t('about').text}</Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">{t('contact').text}</Link>
            {isAffiliate && (
                <Link href="/affiliate" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">{t('affiliate').text}</Link>
            )}
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">{t('terms_of_use').text}</Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">{t('privacy_policy').text}</Link>
          </nav>

          <div className="text-sm text-muted-foreground mt-4" {...t('copyright', { year: new Date().getFullYear() })}>
            {t('copyright', { year: new Date().getFullYear() }).text}
          </div>
        </div>
      </div>
    </footer>
  );
}
