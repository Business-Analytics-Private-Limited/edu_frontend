/**
 * /organizations/:id: one organization. Shows its details and admins,
 * lets the super admin switch modules on/off and suspend / activate it.
 */
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import type { OrganizationDetail } from '../../../../lib/types';
import { ModuleSwitch } from './module-switch';
import { StatusButton } from './status-button';

export default async function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await api<OrganizationDetail>(`/super-admin/organizations/${id}`);

  return (
    <>
      <PageHeader
        title={org.name}
        description={`Slug: ${org.slug}`}
        actions={
          <>
            <Badge variant={org.status === 'ACTIVE' ? 'success' : 'destructive'}>
              {org.status}
            </Badge>
            <StatusButton organizationId={org.id} status={org.status} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Contact</dt>
              <dd>{org.contactName ?? '—'}</dd>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{org.contactEmail ?? '—'}</dd>
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{org.contactPhone ?? '—'}</dd>
              <dt className="text-muted-foreground">Institutions</dt>
              <dd>{org._count.institutions}</dd>
              <dt className="text-muted-foreground">Campuses</dt>
              <dd>{org._count.campuses}</dd>
              <dt className="text-muted-foreground">Users</dt>
              <dd>{org._count.users}</dd>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{new Date(org.createdAt).toLocaleDateString()}</dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modules</CardTitle>
            <CardDescription>
              What this organization has bought. Users only see switched-on modules.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {org.modules.map((module) => (
              <ModuleSwitch
                key={module.key}
                organizationId={org.id}
                moduleKey={module.key}
                name={module.name}
                description={module.description}
                enabled={module.enabled}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Admins</h2>
      <Table>
        <TableHead>
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Status</Th>
            <Th>Last login</Th>
          </tr>
        </TableHead>
        <tbody>
          {org.admins.map((admin) => (
            <tr key={admin.id}>
              <Td className="font-medium">{admin.name}</Td>
              <Td>{admin.email}</Td>
              <Td>
                <Badge variant={admin.status === 'ACTIVE' ? 'success' : 'outline'}>
                  {admin.status}
                </Badge>
              </Td>
              <Td className="text-muted-foreground">
                {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : 'Never'}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
