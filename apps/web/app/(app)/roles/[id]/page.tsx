/**
 * /roles/:id: edit or delete a role. The built-in "Organization admin" role has every
 * permission and can't be changed, so it is shown read-only.
 */
import { ActionForm, Badge, PageHeader } from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import type { Permission, Role } from '../../../../lib/types';
import { deleteRole, updateRole } from '../actions';
import { RoleFields } from '../role-fields';

export default async function RolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [role, permissions] = await Promise.all([
    api<Role>(`/roles/${id}`),
    api<Permission[]>('/permissions'),
  ]);

  if (role.isSystem) {
    return (
      <>
        <PageHeader
          title={role.name}
          description="Built-in role: has every permission and can't be changed."
        />
        <div className="flex flex-wrap gap-2">
          {role.permissions.map((key) => (
            <Badge key={key} variant="outline">
              {key}
            </Badge>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={role.name}
        actions={
          <ActionForm
            action={deleteRole.bind(null, role.id)}
            submitLabel="Delete role"
            pendingLabel="Deleting…"
            confirmMessage={`Delete the role ${role.name}? Only possible when no user has it.`}
            submitVariant="destructive"
            submitSize="sm"
          />
        }
      />
      <ActionForm action={updateRole.bind(null, role.id)} submitLabel="Save" className="gap-6">
        <RoleFields permissions={permissions} role={role} />
      </ActionForm>
    </>
  );
}
