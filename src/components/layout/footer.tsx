import { Theater } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
          <div className="flex items-center space-x-2">
            <Theater className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">Maskshop</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Maskshop. All rights reserved.
          </div>
          <nav className="flex space-x-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
