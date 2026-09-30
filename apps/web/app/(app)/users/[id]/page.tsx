/**
 * /users/:id: one user. Users with "access.user.update" can change the name and roles, and
 * deactivate (block login) or activate the user.
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
} from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import { can, getMe } from '../../../../lib/me';
import type { Role, User } from '../../../../lib/types';
import { setUserStatus, updateUser } from '../actions';
import { RoleChoices } from '../role-choices';

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, user] = await Promise.all([getMe(), api<User>(`/users/${id}`)]);
  const canEdit = can(me, 'access.user.update');
  const roles = canEdit ? await api<Role[]>('/roles') : [];
  const active = user.status === 'ACTIVE';

  return (
    <>
      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <>
            <Badge variant={active ? 'success' : 'outline'}>{user.status}</Badge>
            {canEdit && user.id !== me.id && (
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

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{canEdit ? 'Edit user' : 'Details'}</CardTitle>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <ActionForm action={updateUser.bind(null, user.id)} submitLabel="Save">
              <Field label="Name" htmlFor="name">
                <Input id="name" name="name" defaultValue={user.name} required minLength={2} />
              </Field>
              <RoleChoices
                roles={roles}
                checked={user.roles.map((r) => r.id)}
                myPermissions={me.permissions}
              />
            </ActionForm>
          ) : (
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Roles</dt>
              <dd>{user.roles.map((r) => r.name).join(', ')}</dd>
            </dl>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'never'}
          </p>
        </CardContent>
      </Card>
    </>
  );
}
