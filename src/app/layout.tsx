
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import siteSettings from '@/../appData/siteSettings.json';
import { ClientProviders } from '@/components/client-providers';

// The global metadata has been removed from this root layout.
// SEO metadata is now applied on a per-page basis, starting with the homepage.
export const metadata: Metadata = {
  title: {
    default: siteSettings.siteName,
    template: `%s | ${siteSettings.siteName}`,
  },
  description: siteSettings.siteDescription,
};


const ThemeInitializer = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          const themeStorageKey = 'maskshop-theme';
          const defaultThemeFromServer = "${siteSettings.defaultThemeMode || 'light'}";
          const themeFromLocalStorage = localStorage.getItem(themeStorageKey);
          
          let mode;
          if (themeFromLocalStorage === 'light' || themeFromLocalStorage === 'dark') {
            // 1. User's manually selected theme takes highest priority
            mode = themeFromLocalStorage;
          } else {
            // 2. If no manual override, use the admin-defined default
            mode = defaultThemeFromServer;
          }
          
          const root = document.documentElement;
          root.classList.remove('light', 'dark'); // Clear any previous class
          root.classList.add(mode);
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
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
