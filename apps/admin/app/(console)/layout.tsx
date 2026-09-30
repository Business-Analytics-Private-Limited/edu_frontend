/**
 * The frame of every super admin page after login: sidebar menu, the signed-in person and a
 * "Log out" button. "(console)" is a Next.js route group: it adds this layout without adding
 * "/console" to the URLs.
 */
import { AppShell, Button, UserBadge, type NavSection } from '@eduplatform/ui';
import { Blocks, Building2, KeyRound, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { api } from '../../lib/api';
import type { Me } from '../../lib/types';

const MENU: NavSection[] = [
  {
    items: [
      { href: '/', label: 'Dashboard', icon: <LayoutDashboard /> },
      { href: '/organizations', label: 'Organizations', icon: <Building2 /> },
      { href: '/modules', label: 'Modules', icon: <Blocks /> },
      { href: '/predefined-roles', label: 'Predefined roles', icon: <ShieldCheck /> },
    ],
  },
  {
    title: 'Account',
    items: [{ href: '/account', label: 'Change password', icon: <KeyRound /> }],
  },
];

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const me = await api<Me>('/auth/me');

  return (
    <AppShell
      brand={{ name: 'EduPlatform', subtitle: 'Super admin console' }}
      sections={MENU}
      headerEnd={
        <>
          <UserBadge name={me.name} detail="Super admin" />
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
