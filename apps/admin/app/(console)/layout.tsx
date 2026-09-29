/**
 * Layout of every console page after login: the app shell with the super admin menu.
 * "(console)" is a Next.js route group: it adds this layout without changing URLs.
 *
 * The signed-in staff member is sample data until login is connected (next Phase 2 step).
 */
import { AppShell, UserBadge } from '@eduplatform/ui';
import type { ReactNode } from 'react';
import { ADMIN_NAVIGATION } from '../../lib/navigation';

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      brand={{ name: 'EduPlatform', subtitle: 'Super admin console' }}
      sections={ADMIN_NAVIGATION}
      headerEnd={<UserBadge name="Platform Admin" detail="platform_admin (sample)" />}
    >
      {children}
    </AppShell>
  );
}
