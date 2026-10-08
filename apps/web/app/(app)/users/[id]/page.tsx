/**
 * /users/:id: one user, their roles and where each applies.
 *
 * With "access.user.update" at the right place you can give another role (e.g. Senior faculty
 * at a second campus), take a role away, rename or deactivate the user. Renaming and
 * deactivating affect the user everywhere, so the API allows them only if all the user's roles
 * are within your reach.
 */
import {
  ActionForm,
  Badge,
  Card,
  CardContent,
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
import { can, canAt, getMe } from '../../../../lib/me';
import type { Institution, Role, User } from '../../../../lib/types';
import { addRole, removeRole, renameUser, setUserStatus } from '../actions';
import { PlaceSelect, placeLabel, RoleSelect } from '../place';

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, user] = await Promise.all([getMe(), api<User>(`/users/${id}`)]);
  const canUpdate = can(me, 'access.user.update');
  const [roles, institutions] = canUpdate
    ? await Promise.all([
        api<Role[]>('/roles'),
        can(me, 'platform.institution.view') ? api<Institution[]>('/institutions') : [],
      ])
    : [[], []];
  const active = user.status === 'ACTIVE';
  const placeOf = (r: User['roles'][number]) => ({
    institutionId: r.institution?.id ?? null,
    campusId: r.campus?.id ?? null,
  });
  // Name and status affect the user everywhere: only when all their places are yours.
  const managesWholeUser =
    canUpdate && user.roles.every((r) => canAt(me, 'access.user.update', placeOf(r)));

  return (
    <>
      <PageHeader
        back={{ href: '/users', label: 'Back to users' }}
        title={user.name}
        description={user.email}
        actions={
          <>
            <Badge variant={active ? 'success' : 'outline'}>{user.status}</Badge>
            {managesWholeUser && user.id !== me.id && (
              <ActionForm
                action={setUserStatus.bind(null, user.id, active ? 'deactivate' : 'activate')}
                submitLabel={active ? 'Deactivate' : 'Activate'}
                pendingLabel="…"
                confirmMessage={
                  active ? `Deactivate ${user.name}? They will not be able to log in.` : undefined
                }
                submitVariant={active ? 'destructive' : 'default'}
                submitSize="sm"
              />
            )}
          </>
        }
      />

      <h2 className="mb-3 text-lg font-semibold">Roles</h2>
      <Table>
        <TableHead>
          <tr>
            <Th>Role</Th>
            <Th>Where</Th>
            <Th />
          </tr>
        </TableHead>
        <tbody>
          {user.roles.map((r) => (
            <tr key={r.id}>
              <Td className="font-medium">{r.role.name}</Td>
              <Td>{placeLabel(r)}</Td>
              <Td className="text-right">
                {canAt(me, 'access.user.update', placeOf(r)) && user.roles.length > 1 && (
                  <ActionForm
                    action={removeRole.bind(null, user.id, r.id)}
                    submitLabel="Remove"
                    pendingLabel="Removing…"
                    confirmMessage={`Take the ${r.role.name} role (${placeLabel(r)}) away from ${user.name}?`}
                    submitVariant="ghost"
                    submitSize="sm"
                  />
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {canUpdate && (
          <Card>
            <CardHeader>
              <CardTitle>Give another role</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm action={addRole.bind(null, user.id)} submitLabel="Add role">
                <RoleSelect roles={roles} />
                <PlaceSelect institutions={institutions} me={me} permission="access.user.update" />
              </ActionForm>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{managesWholeUser ? 'Name' : 'Details'}</CardTitle>
          </CardHeader>
          <CardContent>
            {managesWholeUser ? (
              <ActionForm action={renameUser.bind(null, user.id)} submitLabel="Save">
                <Field label="Name" htmlFor="name">
                  <Input id="name" name="name" defaultValue={user.name} required minLength={2} />
                </Field>
              </ActionForm>
            ) : (
              <p className="text-sm text-muted-foreground">
                {canUpdate
                  ? 'This user also works outside your campus / institution, so only their admin there can rename or deactivate them.'
                  : user.name}
              </p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'never'}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
