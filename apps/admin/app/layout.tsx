/**
 * Root layout of the super admin console: the <html> frame and the design system's styles.
 * Never indexed by search engines.
 */
import { Toaster } from '@eduplatform/ui';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { FLASH_COOKIE } from '../lib/flash';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Super admin · EduPlatform', template: '%s · Super admin' },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Pop-up messages after saving (packages/ui toaster.tsx) */}
        <Toaster flashCookie={FLASH_COOKIE} />
      </body>
    </html>
  );
}
