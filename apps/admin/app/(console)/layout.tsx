/**
 * The frame of every super admin page after login: sidebar menu, the signed-in person and a
 * "Log out" button. "(console)" is a Next.js route group: it adds this layout without adding
 * "/console" to the URLs.
 */
import { AppShell, Button, UserBadge, type NavSection } from '@eduplatform/ui';
import {
  Blocks,
  Building2,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';
import { redirect } from 'next/navigation';
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
      { href: '/audit', label: 'Audit log', icon: <ScrollText /> },
    ],
  },
  {
    title: 'Account',
    items: [{ href: '/account', label: 'Password and two-step login', icon: <KeyRound /> }],
  },
];

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const me = await api<Me>('/auth/me');
  // The password from the server's settings is changed first (ADR-0028).
  if (me.mustChangePassword) redirect('/change-password');

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
      {me.twoFactor !== 'on' && (
        <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Two-step login is off. This account controls every organization: turn it on under{' '}
          <a href="/account" className="font-medium underline">
            Account
          </a>
          .
        </p>
      )}
      {children}
    </AppShell>
  );
}
