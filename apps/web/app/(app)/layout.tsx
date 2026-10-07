/**
 * The frame of every page after login: sidebar menu, the signed-in person and a "Log out"
 * button. "(app)" is a Next.js route group: it adds this layout without adding "/app" to URLs.
 *
 * The menu only shows pages the user's role allows (the `permission` of each item).
 */
import { AppShell, Button, UserBadge, type NavItem } from '@eduplatform/ui';
import {
  ArrowLeftRight,
  BarChart3,
  ArrowUpRight,
  BookOpen,
  Building,
  Building2,
  CalendarDays,
  CalendarOff,
  ClipboardCheck,
  GraduationCap,
  History,
  KeyRound,
  Layers,
  LayoutDashboard,
  LogOut,
  Network,
  Settings,
  ShieldCheck,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { can, getMe } from '../../lib/me';

/** Every menu item, and the permission needed to see it (none = everyone). */
const MENU: (NavItem & { permission?: string })[] = [
  { href: '/', label: 'Dashboard', icon: <LayoutDashboard /> },
  {
    href: '/organization',
    label: 'Organization',
    icon: <Building2 />,
    permission: 'platform.organization.view',
  },
  {
    href: '/institutions',
    label: 'Institutions',
    icon: <Building />,
    permission: 'platform.institution.view',
  },
  { href: '/users', label: 'Users', icon: <Users />, permission: 'access.user.view' },
  { href: '/roles', label: 'Roles', icon: <ShieldCheck />, permission: 'access.role.view' },
  { href: '/audit', label: 'Audit log', icon: <History />, permission: 'audit.log.view' },
];

/** The Students menu: only when the organization has the Students module (and the permission). */
const STUDENTS_MENU: (NavItem & { permission: string })[] = [
  {
    href: '/students',
    label: 'Students',
    icon: <GraduationCap />,
    permission: 'students.student.view',
  },
  {
    href: '/students/new',
    label: 'Admit student',
    icon: <UserPlus />,
    permission: 'students.student.create',
  },
  {
    href: '/students/promote',
    label: 'Promote',
    icon: <ArrowUpRight />,
    permission: 'students.enrolment.promote',
  },
  {
    href: '/students/move',
    label: 'Move students',
    icon: <ArrowLeftRight />,
    permission: 'students.enrolment.transfer',
  },
  {
    href: '/students/import',
    label: 'Import students',
    icon: <Upload />,
    permission: 'students.student.import',
  },
  {
    href: '/students/settings',
    label: 'Student settings',
    icon: <Settings />,
    permission: 'students.settings.update',
  },
];

/** The Attendance menu: only when the organization has the Attendance module. */
const ATTENDANCE_MENU: (NavItem & { permission: string })[] = [
  {
    href: '/attendance',
    label: 'Attendance',
    icon: <ClipboardCheck />,
    permission: 'attendance.record.view',
  },
  {
    href: '/attendance/report',
    label: 'Reports',
    icon: <BarChart3 />,
    permission: 'attendance.report.view',
  },
  {
    href: '/attendance/settings',
    label: 'Attendance settings',
    icon: <Settings />,
    permission: 'attendance.policy.update',
  },
];

/** The Academic menu: only when the organization has the Academic module (and the permission). */
const ACADEMIC_MENU: (NavItem & { permission: string })[] = [
  {
    href: '/academic/years',
    label: 'Academic years',
    icon: <CalendarDays />,
    permission: 'academic.year.view',
  },
  {
    href: '/academic/classes',
    label: 'Classes',
    icon: <Network />,
    permission: 'academic.structure.view',
  },
  {
    href: '/academic/batches',
    label: 'Batches',
    icon: <Layers />,
    permission: 'academic.batch.view',
  },
  {
    href: '/academic/subjects',
    label: 'Subjects',
    icon: <BookOpen />,
    permission: 'academic.subject.view',
  },
  {
    href: '/academic/calendar',
    label: 'Calendar',
    icon: <CalendarOff />,
    permission: 'academic.calendar.view',
  },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const me = await getMe();
  // A temporary password is changed first (ADR-0028).
  if (me.mustChangePassword) redirect('/change-password');
  // Parents and students have their own pages (app/portal).
  if (me.kind !== 'staff') redirect('/portal');
  const items = MENU.filter((item) => !item.permission || can(me, item.permission));
  const students = me.enabledModules.includes('students')
    ? STUDENTS_MENU.filter((item) => can(me, item.permission))
    : [];
  const attendance = me.enabledModules.includes('attendance')
    ? ATTENDANCE_MENU.filter((item) => can(me, item.permission))
    : [];
  const academic = me.enabledModules.includes('academic')
    ? ACADEMIC_MENU.filter((item) => can(me, item.permission))
    : [];

  return (
    <AppShell
      brand={{ name: 'EduPlatform', subtitle: me.roleNames.join(', ') }}
      sections={[
        { items },
        ...(students.length > 0 ? [{ title: 'Students', items: students }] : []),
        ...(attendance.length > 0 ? [{ title: 'Attendance', items: attendance }] : []),
        ...(academic.length > 0 ? [{ title: 'Academic', items: academic }] : []),
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
