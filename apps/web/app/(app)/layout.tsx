/**
 * Layout of every page after login: the app shell (sidebar + header) around the page.
 *
 * The folder name "(app)" is a Next.js route group: it groups pages under this layout
 * without adding "/app" to their URLs. The login page lives outside it, without the shell.
 */
import { AppShell, UserBadge } from '@eduplatform/ui';
import type { ReactNode } from 'react';
import { getBootstrap } from '../../lib/bootstrap';
import { buildNavigation } from '../../lib/navigation';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const bootstrap = await getBootstrap();

  return (
    <AppShell
      brand={{
        name: bootstrap.organization.displayName,
        subtitle: bootstrap.institution?.name,
      }}
      sections={buildNavigation(bootstrap)}
      headerEnd={
        <UserBadge name={bootstrap.user.displayName} detail={bootstrap.user.roleSummary} />
      }
    >
      {children}
    </AppShell>
  );
}
