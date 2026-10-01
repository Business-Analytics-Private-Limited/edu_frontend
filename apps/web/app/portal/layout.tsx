/**
 * The frame of the PARENT AND STUDENT PORTAL (/portal/...): a small menu, the logged-in person and
 * "Log out". Staff are sent to the staff pages; parents and students never see those (the staff
 * layout sends them here). If the school hasn't switched the portal on, it says so.
 */
import { AppShell, Button, EmptyState, UserBadge } from '@eduplatform/ui';
import { GraduationCap, KeyRound, LogOut, Users } from 'lucide-react';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getMe } from '../../lib/me';

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const me = await getMe();
  if (me.kind === 'staff') redirect('/');
  const parent = me.kind === 'parent';

  return (
    <AppShell
      brand={{ name: 'EduPlatform', subtitle: parent ? 'Parent portal' : 'Student portal' }}
      sections={[
        {
          items: [
            {
              href: '/portal',
              label: parent ? 'My children' : 'My details',
              icon: parent ? <Users /> : <GraduationCap />,
            },
          ],
        },
        {
          title: 'Account',
          items: [{ href: '/portal/account', label: 'Change password', icon: <KeyRound /> }],
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
      {me.enabledModules.includes('portal') ? (
        children
      ) : (
        <EmptyState
          icon={<GraduationCap />}
          title="The portal is not available yet"
          description="Your school hasn't switched on the parent and student portal. Please contact the school."
        />
      )}
    </AppShell>
  );
}
