/**
 * Root layout of the web app: the <html> frame and the design system's styles.
 * Pages after login use app/(app)/layout.tsx on top of this; the login page doesn't.
 */
import { AlertHost } from '@eduplatform/ui';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { FLASH_COOKIE } from '../lib/flash';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'EduPlatform', template: '%s · EduPlatform' },
  description: 'Institution management',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Pop-up alerts after saving, and "Are you sure?" (packages/ui alerts.tsx) */}
        <AlertHost flashCookie={FLASH_COOKIE} />
      </body>
    </html>
  );
}
