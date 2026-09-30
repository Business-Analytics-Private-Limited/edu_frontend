/**
 * / : the super admin dashboard. Numbers across all organizations, and the newest ones.
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
