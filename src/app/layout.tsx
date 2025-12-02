
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { LanguageProvider } from '@/components/language/language-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ModalProvider } from '@/components/modals/modal-provider';
import { AuthProvider } from '@/components/auth/auth-provider';
import siteSettings from '@/data/siteSettings.json';

export const metadata: Metadata = {
  title: siteSettings.siteName,
  description: siteSettings.siteDescription,
  icons: {
    icon: siteSettings.faviconUrl,
  },
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
        {siteSettings.faviconUrl && <link rel="icon" href={siteSettings.faviconUrl} sizes="any" />}
      </head>
      <body className={cn("font-body antialiased")}>
        <FirebaseClientProvider>
          <LanguageProvider>
            <AuthProvider>
              <Providers>
                <ModalProvider>
                  {children}
                </ModalProvider>
                <Toaster />
              </Providers>
            </AuthProvider>
          </LanguageProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
