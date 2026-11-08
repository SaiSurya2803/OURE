/** @type {import('next').NextConfig} */
const rawApiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const apiUrl = rawApiUrl.replace(/\/$/, '');

const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_API_URL: apiUrl
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`
      }
    ];
  }
};

module.exports = nextConfig;
