
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
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
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      }
    ],
  },
  webpack: (
    config,
    { isServer }
  ) => {
    if (!isServer) {
      // Don't resolve 'async_hooks' on the client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false,
      }
    }

    return config;
  },
};

export default nextConfig;
