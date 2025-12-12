import { Metadata } from 'next';
import { HomePageContent } from '@/components/layout/home-page-content';

import seoData from '@/data/seo.json';

// Note: In a real app with language detection on the server, you'd dynamically
// select the SEO data source. For this example, we'll default to English.
const currentSeoData = seoData.homepage;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: currentSeoData.metaTitle,
    description: currentSeoData.metaDescription,
    keywords: currentSeoData.metaKeywords?.join(', '),
    alternates: {
      canonical: currentSeoData.canonical || undefined,
    },
    openGraph: {
      title: currentSeoData.ogTitle,
      description: currentSeoData.ogDescription,
      url: currentSeoData.ogUrl,
      siteName: currentSeoData.ogSiteName,
      images: [
        {
          url: currentSeoData.ogImage,
          width: 1200,
          height: 630,
          alt: currentSeoData.ogTitle,
        },
      ],
      locale: 'en_US', // Modify based on language
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: currentSeoData.ogTitle,
      description: currentSeoData.ogDescription,
      images: [currentSeoData.ogImage],
    },
  };
}


export default function Home() {
  return <HomePageContent />;
}
