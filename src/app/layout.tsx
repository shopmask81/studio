
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import siteSettings from '@/../appData/siteSettings.json';
import { ClientProviders } from '@/components/client-providers';
import seoData from '@/data/seo.json';
import seoDataAr from '@/data/seo-ar.json';

// This function dynamically generates metadata based on language.
// Note: In a real app, you would fetch the language from headers/cookies.
// For this example, we assume a way to determine the language server-side.
// We will default to English for this implementation.
export async function generateMetadata(): Promise<Metadata> {
  // This logic is simplified. A real app would determine the language
  // from request headers, cookies, or URL path.
  const language = 'en'; // or 'ar'
  const currentSeoData = language === 'ar' ? seoDataAr.homepage : seoData.homepage;

  return {
    title: currentSeoData.metaTitle,
    description: currentSeoData.metaDescription,
    keywords: currentSeoData.metaKeywords?.join(', '),
    openGraph: {
      title: currentSeoData.ogTitle,
      description: currentSeoData.ogDescription,
      url: currentSeoData.ogUrl,
      siteName: currentSeoData.ogSiteName,
      images: [
        {
          url: seoData.homepage.ogImage, // OG image is shared
          width: 1200,
          height: 630,
          alt: currentSeoData.ogTitle,
        },
      ],
      locale: language === 'ar' ? 'ar_AE' : 'en_US',
      type: 'website',
    },
    // Add other metadata tags as needed
  };
}


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
