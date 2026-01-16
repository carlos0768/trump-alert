import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@trump-alert/shared', '@trump-alert/ui'],
};

export default nextConfig;
