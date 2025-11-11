'use client';

import { Theater } from "lucide-react";
import Link from "next/link";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';


export function Footer() {
  const { user } = useUser();
  const firestore = useFirestore();

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
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">About</Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">Contact</Link>
            {isAffiliate && (
                <Link href="/affiliate" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">Affiliate</Link>
            )}
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">Terms of Use</Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">Privacy Policy</Link>
          </nav>

          <div className="text-sm text-muted-foreground mt-4">
            © {new Date().getFullYear()} MaskShop. All Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
