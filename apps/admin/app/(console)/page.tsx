/**
 * / : the super admin dashboard. Numbers across all organizations, quick links to the main
 * jobs, and the newest organizations.
 */
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../lib/api';
import type { Dashboard } from '../../lib/types';

/** The super admin's main jobs, one click from the dashboard. */
const QUICK_LINKS = [
  {
    href: '/organizations/new',
    title: 'New organization',
    text: 'Onboard a customer with its first admin',
  },
  {
    href: '/predefined-roles',
    title: 'Predefined roles',
    text: 'What Director, Principal, Campus admin… may do, for every organization',
  },
  {
    href: '/organizations',
    title: 'Organizations',
    text: 'Switch modules on or off, suspend or activate',
  },
];

export default async function DashboardPage() {
  const data = await api<Dashboard>('/super-admin/dashboard');

  const numbers = [
    { label: 'Organizations', value: data.organizations.total },
    { label: 'Active', value: data.organizations.active },
    { label: 'Suspended', value: data.organizations.suspended },
    { label: 'Institutions', value: data.institutions },
    { label: 'Users', value: data.users },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="All organizations using EduPlatform"
        actions={
          <Button asChild>
            <Link href="/organizations/new">New organization</Link>
          </Button>
        }
      />

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

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
          >
            <div className="font-medium">{link.title}</div>
            <div className="text-sm text-muted-foreground">{link.text}</div>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Newest organizations</h2>
      {data.recentOrganizations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No organizations yet. Create the first one.</p>
      ) : (
        <Table>
          <TableHead>
            <tr>
              <Th>Name</Th>
              <Th>Slug</Th>
              <Th>Status</Th>
              <Th>Created</Th>
            </tr>
          </TableHead>
          <tbody>
            {data.recentOrganizations.map((org) => (
              <tr key={org.id}>
                <Td>
                  <Link
                    href={`/organizations/${org.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {org.name}
                  </Link>
                </Td>
                <Td className="text-muted-foreground">{org.slug}</Td>
                <Td>
                  <Badge variant={org.status === 'ACTIVE' ? 'success' : 'destructive'}>
                    {org.status}
                  </Badge>
                </Td>
                <Td className="text-muted-foreground">
                  {new Date(org.createdAt).toLocaleDateString('en-IN')}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
