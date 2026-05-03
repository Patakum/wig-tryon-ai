import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: (
      process.env.NEXT_PUBLIC_ALLOWED_IMAGE_HOSTS ||
      'res.cloudinary.com,*.gstatic.com,*.googleusercontent.com'
    )
      .split(',')
      .map((host) => ({
        protocol: 'https',
        hostname: host.trim(),
      })),
  },
};

export default nextConfig;
