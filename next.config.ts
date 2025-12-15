
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  async headers() {
    const noIndexHeaders = [
      {
        key: 'X-Robots-Tag',
        value: 'noindex, nofollow',
      },
    ];

    return [
      {
        source: '/admin/:path*',
        headers: noIndexHeaders,
      },
      {
        source: '/account/:path*',
        headers: noIndexHeaders,
      },
      {
        source: '/login',
        headers: noIndexHeaders,
      },
      {
        source: '/signup',
        headers: noIndexHeaders,
      },
      {
        source: '/cart',
        headers: noIndexHeaders,
      },
      {
        source: '/checkout',
        headers: noIndexHeaders,
      },
      {
        source: '/order-confirmation',
        headers: noIndexHeaders,
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
