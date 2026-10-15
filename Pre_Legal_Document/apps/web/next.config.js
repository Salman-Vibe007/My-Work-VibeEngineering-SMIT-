/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  output: process.platform === 'win32' ? undefined : 'standalone',
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig