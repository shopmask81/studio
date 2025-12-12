import { Metadata } from 'next';
import { HomePageContent } from '@/components/layout/home-page-content';

import seoData from '@/data/seo.json';

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
      locale: 'en_US', 
      type: 'website',
    },
    twitter: {
      card: currentSeoData.twitterCard as "summary" | "summary_large_image" | "app" | "player" || "summary_large_image",
      title: currentSeoData.twitterTitle,
      description: currentSeoData.twitterDescription,
      images: [currentSeoData.twitterImage], 
      site: currentSeoData.twitterUrl
    },
  };
}


export default function Home() {
  return <HomePageContent />;
}
