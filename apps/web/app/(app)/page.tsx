/**
 * / : the home page after login. Every logged-in user can open it, and each person sees their
 * own version:
 *   - their roles and where each applies ("Campus admin · Kukatpally");
 *   - numbers for the part they look after: the whole organization, or their institutions /
 *     campuses (the API counts only those);
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
import type { Dashboard, Grant, Institution } from '../../lib/types';

/** Module names, and whether their screens exist yet. */
const MODULES: Record<string, { name: string; live: boolean }> = {
  academic: { name: 'Academic', live: true },
  students: { name: 'Students', live: true },
  attendance: { name: 'Attendance', live: true },
  portal: { name: 'Parent and student portal', live: false },
  imports: { name: 'Data import', live: false },
};

export default async function DashboardPage() {
  const me = await getMe();
  const [data, institutions] = await Promise.all([
    api<Dashboard>('/dashboard'),
    can(me, 'platform.institution.view') ? api<Institution[]>('/institutions') : [],
  ]);

  // Names of places, for "Campus admin · Kukatpally (Sri Vidya JC)".
  const names = new Map<string, string>();
  for (const institution of institutions) {
    names.set(institution.id, institution.name);
    for (const campus of institution.campuses) names.set(campus.id, campus.name);
  }
  const placeOf = (g: Grant) => {
    if (g.campusId) {
      const campus = names.get(g.campusId) ?? 'a campus';
      const institution = g.institutionId ? names.get(g.institutionId) : undefined;
      return institution ? `${campus} (${institution})` : campus;
    }
    if (g.institutionId) return names.get(g.institutionId) ?? 'an institution';
    return 'Whole organization';
  };

  const wholeOrganization = me.grants.some((g) => !g.institutionId && !g.campusId);
  const scope = wholeOrganization ? 'in your organization' : 'in your institutions / campuses';

  const numbers = [
    { label: 'Institutions', value: data.institutions, show: true },
    { label: 'Campuses', value: data.campuses, show: true },
    { label: 'Users', value: data.users, show: can(me, 'access.user.view') },
    { label: 'Active users', value: data.activeUsers, show: can(me, 'access.user.view') },
    { label: 'Roles', value: data.roles, show: can(me, 'access.role.view') },
  ].filter((n) => n.show);

  const actions = [
    { href: '/users/new', label: 'Add a user', show: can(me, 'access.user.create') },
    {
      href: '/institutions',
      label: 'Add an institution',
      show: canAt(me, 'platform.institution.create', {}),
    },
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
            <CardContent className="text-3xl font-semibold">{item.value}</CardContent>
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
