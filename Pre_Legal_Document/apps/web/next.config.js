/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@prelegal/ui',
    '@prelegal/shared',
    '@prelegal/validation',
    '@prelegal/template-engine',
    '@prelegal/document-engine',
    '@prelegal/database',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig