/**
 * /users/:id: one user, their roles and where each applies.
 *
 * With "access.user.update" at the right place you can give another role (e.g. Senior faculty
 * at a second branch), take a role away, rename or deactivate the user, or reset a forgotten
 * password. Renaming, deactivating and resetting the password affect the user everywhere, so the
 * API allows them only if all the user's roles are within your reach.
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
  ResetPasswordButton,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { can, canAt, getMe } from '../../../../lib/me';
import type { Branch, Role, User } from '../../../../lib/types';
import { addRole, removeRole, renameUser, resetPassword, setUserStatus } from '../actions';
import { PlaceSelect, placeLabel, RoleSelect } from '../place';

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, user] = await Promise.all([getMe(), api<User>(`/users/${id}`)]);
  const canUpdate = can(me, 'access.user.update');
  const [roles, branches] = canUpdate
    ? await Promise.all([
        api<Role[]>('/roles'),
        can(me, 'platform.branch.view') ? api<Branch[]>('/branches') : [],
      ])
    : [[], []];
  const active = user.status === 'ACTIVE';
  const placeOf = (r: User['roles'][number]) => ({ branchId: r.branch?.id ?? null });
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
                <PlaceSelect branches={branches} me={me} permission="access.user.update" />
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
                  ? 'This user also works outside your branch, so only their admin there can rename or deactivate them.'
                  : user.name}
              </p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'never'}
            </p>
          </CardContent>
        </Card>

        {managesWholeUser && (
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-3">
              {user.id === me.id ? (
                <p className="text-sm text-muted-foreground">
                  You change your own password on the{' '}
                  <Link href="/account" className="underline">
                    Change password
                  </Link>{' '}
                  page.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Forgot their password, or locked out after wrong tries? Give them a temporary
                    one. They must change it when they log in.
                  </p>
                  <ResetPasswordButton name={user.name} reset={resetPassword.bind(null, user.id)} />
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
