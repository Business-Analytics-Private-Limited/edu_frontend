/**
 * /roles/:id: one role.
 *   - predefined role: shown read-only (only EduPlatform can change it);
 *   - own role: edit it ("access.role.update") or delete it ("access.role.delete").
 */
import { ActionForm, PageHeader, PermissionGrid } from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import { canAt, getMe } from '../../../../lib/me';
import type { PermissionResource, Role } from '../../../../lib/types';
import { deleteRole, updateRole } from '../actions';
import { RoleFields } from '../role-fields';

export default async function RolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, role, resources] = await Promise.all([
    getMe(),
    api<Role>(`/roles/${id}`),
    api<PermissionResource[]>('/permissions'),
  ]);
  const hasMore = role.permissions.some((p) => !me.permissions.includes(p));
  // Roles are shared by the whole organization: changing them needs the permission there.
  const canEdit = !role.predefined && canAt(me, 'access.role.update', {}) && !hasMore;
  const canDelete = !role.predefined && canAt(me, 'access.role.delete', {});

  if (!canEdit) {
    return (
      <>
        <PageHeader
          title={role.name}
          description={
            role.predefined
              ? 'Predefined role: the same in every organization. Only EduPlatform can change it.'
              : (role.description ?? undefined)
          }
          actions={canDelete && <DeleteButton role={role} />}
        />
        <PermissionGrid resources={resources} checked={role.permissions} readOnly />
      </>
    );
  }

  return (
    <>
      <PageHeader title={role.name} actions={canDelete && <DeleteButton role={role} />} />
      <ActionForm action={updateRole.bind(null, role.id)} submitLabel="Save" className="gap-6">
        <RoleFields resources={resources} role={role} myPermissions={me.permissions} />
      </ActionForm>
    </>
  );
}

function DeleteButton({ role }: { role: Role }) {
  return (
    <ActionForm
      action={deleteRole.bind(null, role.id)}
      submitLabel="Delete role"
      pendingLabel="Deleting…"
      confirmMessage={`Delete the role ${role.name}? Only possible when no user has it.`}
      submitVariant="destructive"
      submitSize="sm"
    />
  );
}
