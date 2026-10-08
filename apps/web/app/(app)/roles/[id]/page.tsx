/**
 * /roles/:id: one role.
 *   - own role: edit its name, description and permissions ("access.role.update") or delete it
 *     ("access.role.delete");
 *   - predefined role (Director, Principal, ...): its PERMISSIONS can be changed for this
 *     organization (ADR-0029). It then shows "Customized" and keeps these permissions when
 *     EduPlatform changes the role, until "Reset to EduPlatform defaults". Its name stays, and
 *     it can't be deleted;
 *   - Organization admin, Parent, Student: read-only.
 * Roles are shared by the whole organization: changing them needs the permission there, and
 * only permissions you have yourself can be ticked.
 */
import { ActionForm, Badge, PageHeader, PermissionGrid } from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import { canAt, getMe } from '../../../../lib/me';
import type { PermissionResource, Role } from '../../../../lib/types';
import { deleteRole, resetRole, updatePredefinedRole, updateRole } from '../actions';
import { RoleFields } from '../role-fields';

export default async function RolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, role, resources] = await Promise.all([
    getMe(),
    api<Role>(`/roles/${id}`),
    api<PermissionResource[]>('/permissions'),
  ]);
  const hasMore = role.permissions.some((p) => !me.permissions.includes(p));
  const canEdit = role.editable && canAt(me, 'access.role.update', {}) && !hasMore;
  const canDelete = !role.predefined && canAt(me, 'access.role.delete', {});

  if (!canEdit) {
    return (
      <>
        <PageHeader
          title={role.name}
          description={readOnlyReason(role, hasMore)}
          actions={canDelete && <DeleteButton role={role} />}
        />
        <PermissionGrid resources={resources} checked={role.permissions} readOnly />
      </>
    );
  }

  if (role.predefined) {
    return (
      <>
        <PageHeader
          title={role.name}
          description={role.description ?? undefined}
          actions={
            role.customized ? (
              <>
                <Badge variant="warning">Customized</Badge>
                <ActionForm
                  action={resetRole.bind(null, role.id)}
                  submitLabel="Reset to EduPlatform defaults"
                  pendingLabel="Resetting…"
                  confirmMessage={`Put ${role.name} back to EduPlatform's permissions? Your changes to this role are lost.`}
                  submitVariant="outline"
                  submitSize="sm"
                />
              </>
            ) : (
              <Badge variant="outline">EduPlatform defaults</Badge>
            )
          }
        />
        <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
          {role.customized
            ? "You changed this role's permissions for your organization. EduPlatform's later changes to it don't affect it until you reset it."
            : 'A predefined role, as EduPlatform set it up. You can change its permissions for your organization; it then keeps your choice when EduPlatform changes the role.'}{' '}
          It applies to everyone who has the role ({role._count.users} user(s)).
        </p>
        <ActionForm
          action={updatePredefinedRole.bind(null, role.id)}
          submitLabel="Save permissions"
          className="gap-6"
        >
          <PermissionGrid
            resources={resources}
            checked={role.permissions}
            allowed={me.permissions}
          />
        </ActionForm>
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

function readOnlyReason(role: Role, hasMore: boolean): string | undefined {
  if (role.predefined && !role.editable) {
    return role.assignable
      ? 'The Organization admin always has every permission.'
      : 'Parents and students use portal logins, which have no permissions to change.';
  }
  if (hasMore) return "This role has permissions you don't have, so you can't change it.";
  return role.description ?? undefined;
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
