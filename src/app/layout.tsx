
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import siteSettings from '@/../appData/siteSettings.json';
import { ClientProviders } from '@/components/client-providers';

// This component runs a script to apply theme settings before the page hydrates.
const ThemeInitializer = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          // --- THEME ---
          const themeStorageKey = 'maskshop-theme';
          const defaultThemeFromServer = "${siteSettings.defaultThemeMode || 'light'}";
          const themeFromLocalStorage = localStorage.getItem(themeStorageKey);
          
          let mode;
          if (themeFromLocalStorage === 'light' || themeFromLocalStorage === 'dark') {
            mode = themeFromLocalStorage;
          } else {
            mode = defaultThemeFromServer;
          }
          
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(mode);
        })();
      `,
    }}
  />
);

export const metadata: Metadata = {
  // Rely on the /favicon.ico route for the icon.
  // This is the most reliable method.
};

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
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
