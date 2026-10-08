/**
 * /organizations/:id: one organization. Shows its details and admins, lets the super admin
 * switch modules on/off, suspend / activate it, and add, deactivate / activate or delete its
 * institutions (only the super admin does that, ADR-0025 and ADR-0026). Delete is only offered
 * for an institution without campuses; anything else is deactivated.
 */
import {
  ActionForm,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Input,
  PageHeader,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import type { OrganizationDetail } from '../../../../lib/types';
import { addInstitution, deleteInstitution, setInstitutionStatus } from '../actions';
import { ModuleSwitch } from './module-switch';
import { StatusButton } from './status-button';

export default async function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await api<OrganizationDetail>(`/super-admin/organizations/${id}`);

  return (
    <>
      <PageHeader
        back={{ href: '/organizations', label: 'Back to organizations' }}
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
              <dd>
                {org.campuses.active} active
                {org.campuses.inactive > 0 && ` · ${org.campuses.inactive} inactive`}
              </dd>
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

      <h2 className="mb-3 mt-8 text-lg font-semibold">Institutions</h2>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <TableHead>
              <tr>
                <Th>Name</Th>
                <Th>Code</Th>
                <Th>Campuses</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </TableHead>
            <tbody>
              {org.institutions.map((institution) => (
                <tr key={institution.id}>
                  <Td className="font-medium">{institution.name}</Td>
                  <Td>{institution.code}</Td>
                  <Td>{institution._count.campuses}</Td>
                  <Td>
                    <Badge variant={institution.status === 'ACTIVE' ? 'success' : 'outline'}>
                      {institution.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      {institution.status === 'ACTIVE' ? (
                        <ActionForm
                          action={setInstitutionStatus.bind(
                            null,
                            org.id,
                            institution.id,
                            'deactivate',
                          )}
                          submitLabel="Deactivate"
                          pendingLabel="…"
                          confirmMessage={`Deactivate ${institution.name}? Its records are kept and can be read, but nothing new can be added there or at its campuses, and staff roles there stop working.`}
                          submitVariant="outline"
                          submitSize="sm"
                        />
                      ) : (
                        <ActionForm
                          action={setInstitutionStatus.bind(
                            null,
                            org.id,
                            institution.id,
                            'activate',
                          )}
                          submitLabel="Activate"
                          pendingLabel="…"
                          submitVariant="outline"
                          submitSize="sm"
                        />
                      )}
                      {institution._count.campuses === 0 && (
                        <ActionForm
                          action={deleteInstitution.bind(null, org.id, institution.id)}
                          submitLabel="Delete"
                          pendingLabel="Deleting…"
                          confirmMessage={`Delete ${institution.name}? Only an empty institution can be deleted.`}
                          submitVariant="ghost"
                          submitSize="sm"
                        />
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
              {org.institutions.length === 0 && (
                <tr>
                  <Td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No institutions yet.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add institution</CardTitle>
            <CardDescription>
              The organization&apos;s admin then adds its campuses and sets up its class levels.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActionForm
              action={addInstitution.bind(null, org.id)}
              submitLabel="Add institution"
              resetOnSuccess
            >
              <Field label="Name" htmlFor="name">
                <Input
                  id="name"
                  name="name"
                  required
                  minLength={2}
                  placeholder="Sri Vidya Degree College"
                />
              </Field>
              <Field label="Code" htmlFor="code" hint="Capital letters, digits, _ and -">
                <Input
                  id="code"
                  name="code"
                  required
                  pattern="[A-Za-z0-9_\-]{2,20}"
                  placeholder="SVDC"
                />
              </Field>
            </ActionForm>
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
