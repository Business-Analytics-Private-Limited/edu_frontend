/**
 * Next.js settings for the web app.
 */
import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  // The ui package is TypeScript source; Next.js compiles it with the app.
  transpilePackages: ['@eduplatform/ui'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' }, // no embedding in other sites (clickjacking)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default config;
