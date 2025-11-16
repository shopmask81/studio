
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { LanguageProvider } from '@/components/language/language-provider';
import { AuthProvider } from '@/components/auth/auth-provider';
import { FirebaseProvider } from '@/firebase/provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export const metadata: Metadata = {
  title: 'MaskShop',
  description: 'The finest handmade and vintage crafts, delivered.',
};

const ThemeInitializer = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          const themeStorageKey = 'maskshop-theme';
          const theme = localStorage.getItem(themeStorageKey);
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const mode = theme === 'light' || theme === 'dark' ? theme : (prefersDark ? 'dark' : 'light');
          document.documentElement.classList.add(mode);
        })();
      `,
    }}
  />
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeInitializer />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400..900&family=Lato:wght@400;700&family=Cairo:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased")}>
        <FirebaseProvider>
          <AuthProvider>
            <LanguageProvider>
              <Providers>
                <FirebaseErrorListener />
                {children}
                <Toaster />
              </Providers>
            </LanguageProvider>
          </AuthProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
