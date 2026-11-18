/**
 * / : the home page after login. Every logged-in user can open it, and each person sees their
 * own version:
 *   - their roles and where each applies ("Branch admin · KPHB");
 *   - numbers for the part they look after: the whole organization, or their branches (the API
 *     counts only those);
 *   - quick actions they are allowed to use;
 *   - the modules their organization has, and which are live.
 */
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../lib/api';
import { can, canAt, getMe } from '../../lib/me';
import type { Branch, Dashboard, Grant } from '../../lib/types';

/** Module names, and whether their screens exist yet. */
const MODULES: Record<string, { name: string; live: boolean }> = {
  academic: { name: 'Academic', live: true },
  students: { name: 'Students', live: true },
  attendance: { name: 'Attendance', live: true },
  portal: { name: 'Parent and student portal', live: true },
  imports: { name: 'Data import', live: false },
};

export default async function DashboardPage() {
  const me = await getMe();
  const [data, branches] = await Promise.all([
    api<Dashboard>('/dashboard'),
    can(me, 'platform.branch.view') ? api<Branch[]>('/branches') : [],
  ]);

  // Branch names, for "Branch admin · KPHB".
  const names = new Map(branches.map((b) => [b.id, b.name]));
  const placeOf = (g: Grant) =>
    g.branchId ? (names.get(g.branchId) ?? 'a branch') : 'Whole organization';

  const wholeOrganization = me.grants.some((g) => !g.branchId);
  const scope = wholeOrganization ? 'in your organization' : 'in your branches';

  const numbers = [
    {
      label: 'Branches',
      value: data.branches,
      note: data.inactiveBranches ? `${data.inactiveBranches} inactive` : undefined,
      show: true,
    },
    {
      label: 'Current students',
      value: data.students?.current ?? 0,
      note: data.students?.outgoing ? `${data.students.outgoing} outgoing` : undefined,
      show: data.students !== null && can(me, 'students.student.view'),
    },
    { label: 'Users', value: data.users, show: can(me, 'access.user.view') },
    { label: 'Active users', value: data.activeUsers, show: can(me, 'access.user.view') },
    { label: 'Roles', value: data.roles, show: can(me, 'access.role.view') },
  ].filter((n) => n.show);

  const actions = [
    {
      href: '/students/new',
      label: 'Admit a student',
      show: me.enabledModules.includes('students') && can(me, 'students.student.create'),
    },
    { href: '/users/new', label: 'Add a user', show: can(me, 'access.user.create') },
    { href: '/roles/new', label: 'Create a role', show: canAt(me, 'access.role.create', {}) },
    { href: '/audit', label: 'See recent changes', show: can(me, 'audit.log.view') },
    { href: '/account', label: 'Change my password', show: true },
  ].filter((a) => a.show);

  return (
    <>
      <PageHeader title={`Welcome, ${me.name}`} description={`Numbers ${scope}`} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {numbers.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-semibold">{item.value}</span>
              {'note' in item && item.note && (
                <span className="ml-2 text-sm text-muted-foreground">{item.note}</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Your roles</CardTitle>
            <CardDescription>What you may do, and where.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {me.grants.map((g, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <Badge>{g.roleName}</Badge>
                  <span className="text-muted-foreground">{placeOf(g)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-2">
            {actions.map((a) => (
              <Button key={a.href} asChild variant="link" className="h-auto p-0">
                <Link href={a.href}>{a.label}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modules</CardTitle>
            <CardDescription>Switched on for your organization by EduPlatform.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {me.enabledModules.length === 0 && (
              <p className="text-muted-foreground">No modules yet.</p>
            )}
            {me.enabledModules.map((key) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span>{MODULES[key]?.name ?? key}</span>
                {MODULES[key]?.live ? (
                  <Badge variant="success">Live</Badge>
                ) : (
                  <Badge variant="outline">Coming soon</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
