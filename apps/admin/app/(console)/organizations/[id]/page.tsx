/**
 * /organizations/:id: one organization. Shows its details and admins, lets the super admin
 * change its name, code and type (the type only while it has no academic structure), switch
 * modules on/off, suspend / activate it, and add, close / reopen or delete its BRANCHES (only the
 * super admin does that, ADR-0030; ADR-0026 for closing). Delete is only for an empty branch.
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
  Select,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import { ORGANIZATION_TYPES, type OrganizationDetail } from '../../../../lib/types';
import { addBranch, deleteBranch, setBranchStatus, updateOrganization } from '../actions';
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
        description={`${ORGANIZATION_TYPES[org.type]} · code ${org.code} · slug ${org.slug}`}
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
            <dl className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 gap-y-2 break-words text-sm">
              <dt className="text-muted-foreground">Structure</dt>
              <dd>{org.levelNames.join(' › ')}</dd>
              <dt className="text-muted-foreground">Contact</dt>
              <dd>{org.contactName ?? '—'}</dd>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{org.contactEmail ?? '—'}</dd>
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{org.contactPhone ?? '—'}</dd>
              <dt className="text-muted-foreground">Branches</dt>
              <dd>{org._count.branches}</dd>
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

        <Card>
          <CardHeader>
            <CardTitle>Name, code and type</CardTitle>
            <CardDescription>
              The type decides the academic structure; it can only change while the organization has
              set up no structure and admitted no students.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActionForm action={updateOrganization.bind(null, org.id)} submitLabel="Save">
              <Field label="Name" htmlFor="orgName">
                <Input id="orgName" name="name" defaultValue={org.name} required />
              </Field>
              <Field label="Code" htmlFor="orgCode" hint="Used in admission numbers ({CODE})">
                <Input
                  id="orgCode"
                  name="code"
                  defaultValue={org.code}
                  required
                  pattern="[A-Za-z0-9]{2,10}"
                />
              </Field>
              <Field label="Type" htmlFor="orgType">
                <Select id="orgType" name="type" defaultValue={org.type}>
                  {Object.entries(ORGANIZATION_TYPES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Branches</h2>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <TableHead>
              <tr>
                <Th>Name</Th>
                <Th>Code</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </TableHead>
            <tbody>
              {org.branches.map((branch) => (
                <tr key={branch.id}>
                  <Td className="font-medium">{branch.name}</Td>
                  <Td>{branch.code}</Td>
                  <Td>
                    <Badge variant={branch.status === 'ACTIVE' ? 'success' : 'outline'}>
                      {branch.status === 'ACTIVE' ? 'Active' : 'Closed'}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      {branch.status === 'ACTIVE' ? (
                        <ActionForm
                          action={setBranchStatus.bind(null, org.id, branch.id, 'deactivate')}
                          submitLabel="Close"
                          pendingLabel="…"
                          confirmMessage={`Close ${branch.name}? Its records are kept and can be read, but nothing new can happen there, and staff roles there stop working.`}
                          submitVariant="outline"
                          submitSize="sm"
                        />
                      ) : (
                        <ActionForm
                          action={setBranchStatus.bind(null, org.id, branch.id, 'activate')}
                          submitLabel="Open again"
                          pendingLabel="…"
                          submitVariant="outline"
                          submitSize="sm"
                        />
                      )}
                      <ActionForm
                        action={deleteBranch.bind(null, org.id, branch.id)}
                        submitLabel="Delete"
                        pendingLabel="Deleting…"
                        confirmMessage={`Delete ${branch.name}? Only an empty branch (added by mistake) can be deleted.`}
                        submitVariant="destructive"
                        submitSize="sm"
                      />
                    </div>
                  </Td>
                </tr>
              ))}
              {org.branches.length === 0 && (
                <tr>
                  <Td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No branches yet.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add branch</CardTitle>
            <CardDescription>A location of the organization, e.g. KPHB.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActionForm
              action={addBranch.bind(null, org.id)}
              submitLabel="Add branch"
              resetOnSuccess
            >
              <Field label="Name" htmlFor="name">
                <Input id="name" name="name" required minLength={2} placeholder="KPHB" />
              </Field>
              <Field label="Code" htmlFor="code" hint="Capital letters, digits, _ and -">
                <Input
                  id="code"
                  name="code"
                  required
                  pattern="[A-Za-z0-9_\-]{2,20}"
                  placeholder="KPHB"
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
