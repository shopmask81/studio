
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
        missing: [
          {
            type: 'header',
            key: 'next-router-prefetch',
          },
          {
            type: 'header',
            key: 'purpose',
            value: 'prefetch',
          },
        ],
      },
      {
        source: '/(admin|account)/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/(login|signup|cart|checkout|order-confirmation)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ]
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ignore the appData directory on the client side
      config.watchOptions = {
        ...config.watchOptions,
        ignored: /appData/,
      };
    }
    return config;
  },
};

export default nextConfig;
