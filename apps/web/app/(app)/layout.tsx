/**
 * The frame of every page after login: sidebar menu, the signed-in person and a "Log out"
 * button. "(app)" is a Next.js route group: it adds this layout without adding "/app" to URLs.
 *
 * The menu only shows pages the user's role allows (the `permission` of each item).
 */
import { AppShell, Button, UserBadge, type NavItem } from '@eduplatform/ui';
import {
  Building,
  Building2,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { can, getMe } from '../../lib/me';

/** Every menu item, and the permission needed to see it (none = everyone). */
const MENU: (NavItem & { permission?: string })[] = [
  { href: '/', label: 'Dashboard', icon: <LayoutDashboard /> },
  {
    href: '/organization',
    label: 'Organization',
    icon: <Building2 />,
    permission: 'platform.institution.view',
  },
  {
    href: '/institutions',
    label: 'Institutions',
    icon: <Building />,
    permission: 'platform.institution.view',
  },
  { href: '/users', label: 'Users', icon: <Users />, permission: 'access.user.view' },
  { href: '/roles', label: 'Roles', icon: <ShieldCheck />, permission: 'access.role.manage' },
  { href: '/audit', label: 'Audit log', icon: <History />, permission: 'audit.log.view' },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const me = await getMe();
  const items = MENU.filter((item) => !item.permission || can(me, item.permission));

  return (
    <AppShell
      brand={{ name: 'EduPlatform', subtitle: me.roleName ?? undefined }}
      sections={[
        { items },
        {
          title: 'Account',
          items: [{ href: '/account', label: 'Change password', icon: <KeyRound /> }],
        },
      ]}
      headerEnd={
        <>
          <UserBadge name={me.name} detail={me.email} />
          <form action="/logout" method="post">
            <Button type="submit" variant="ghost" size="sm" title="Log out">
              <LogOut />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </form>
        </>
      }
    >
      {children}
    </AppShell>
  );
}
