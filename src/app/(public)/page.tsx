
import { Metadata } from 'next';
import { HomePageContent } from '@/components/layout/home-page-content';

import seoData from '@/data/seo.json';
import structuredData from '@/data/seo/structuredData.json';

// Since this is now a server component, we need to handle potential dynamic data loading.
// For now, we assume the data is static as per the original file.
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
      card: (currentSeoData.twitterCard as "summary" | "summary_large_image" | "app" | "player") || "summary_large_image",
      title: currentSeoData.twitterTitle,
      description: currentSeoData.twitterDescription,
      images: [currentSeoData.twitterImage], 
      site: currentSeoData.twitterUrl
    },
  };
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': structuredData.appType || "WebApplication",
  name: structuredData.appName,
  url: structuredData.appUrl,
  description: structuredData.appDescription,
  applicationCategory: structuredData.applicationCategory,
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: structuredData.price,
    priceCurrency: 'USD',
  },
  ...(structuredData.averageRating && structuredData.reviewsCount && {
      aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: structuredData.averageRating,
      reviewCount: structuredData.reviewsCount,
    }
  }),
  screenshot: structuredData.screenshotUrl,
  logo: structuredData.logoUrl,
  developer: {
    '@type': structuredData.developerType || 'Organization',
    name: structuredData.developerName,
  },
};


export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePageContent />
    </>
  );
}
