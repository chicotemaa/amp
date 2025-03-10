/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui', 'lucide-react'],
    optimizeServerComponents: true,
  },
};

module.exports = nextConfig;