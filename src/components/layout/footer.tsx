
import { Theater } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t mt-16 bg-card/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="flex items-center space-x-2 justify-center md:justify-start">
            <Theater className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">MaskShop</span>
          </div>
          <nav className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6">
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Use</Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
          </nav>
          <div className="text-sm text-muted-foreground text-center md:text-right">
            © {new Date().getFullYear()} MaskShop. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
