/**
 * Next.js settings for the super admin console: never indexed by search engines, never shown
 * inside another site, no referrer sent.
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
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default config;
