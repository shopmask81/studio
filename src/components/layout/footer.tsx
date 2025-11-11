
import { Theater } from "lucide-react";
import Link from "next/link";

export function Footer() {
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
            <Link href="/affiliate" className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">Affiliate</Link>
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
