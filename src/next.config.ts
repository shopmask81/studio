
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // This rule applies the X-Robots-Tag to all specified paths.
        // It's a more robust way to control indexing than just robots.txt.
        source: '/:path((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
        // The 'missing' array ensures this rule only applies to actual page visits
        // and not to prefetching, which improves performance.
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
        // The 'has' array ensures this rule ONLY applies to the specified routes.
        has: [
          {
            type: 'route',
            key: 'path',
            // This regex matches /admin, /account, and the specific single pages.
            value: '(?<path>admin|account|login|signup|cart|checkout|order-confirmation)(/.*)?',
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
