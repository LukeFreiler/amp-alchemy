import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  serverExternalPackages: ['resend', '@react-email/render', '@react-email/components'],
};

export default nextConfig;
