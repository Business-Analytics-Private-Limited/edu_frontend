/**
 * Root layout of the super admin console: the <html> frame and the design system's styles.
 * Never indexed by search engines.
 */
import { AlertHost } from '@eduplatform/ui';
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
      {/* Browser extensions (e.g. Grammarly) add attributes to <body> before React loads;
          ignore those differences here only. */}
      <body suppressHydrationWarning>
        {children}
        {/* Pop-up alerts after saving, and "Are you sure?" (packages/ui alerts.tsx) */}
        <AlertHost flashCookie={FLASH_COOKIE} />
      </body>
    </html>
  );
}
