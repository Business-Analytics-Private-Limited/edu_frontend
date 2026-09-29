/**
 * Next.js settings for the super admin console. Stricter than the web app: never indexed by
 * search engines, never embedded, no referrer sent.
 */
import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  // Workspace packages are TypeScript source; Next.js compiles them with the app.
  transpilePackages: ['@eduplatform/ui', '@eduplatform/api'],
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
