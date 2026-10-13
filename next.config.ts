import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // face-api.js / node-fetch reference Node-only modules that browsers never use
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        encoding: false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: (
      process.env.NEXT_PUBLIC_ALLOWED_IMAGE_HOSTS ||
      'res.cloudinary.com,*.gstatic.com,*.googleusercontent.com,cdn.builder.io'
    )
      .split(',')
      .map((host) => ({
        protocol: 'https',
        hostname: host.trim(),
      })),
  },
};

export default nextConfig;
