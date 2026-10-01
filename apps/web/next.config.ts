/**
 * Next.js settings for the web app.
 */
import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  // The ui package is TypeScript source; Next.js compiles it with the app.
  transpilePackages: ['@eduplatform/ui'],
  experimental: {
    // Student documents are uploaded through server actions: up to 5 MB per file (plus form data).
    serverActions: { bodySizeLimit: '6mb' },
  },
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
