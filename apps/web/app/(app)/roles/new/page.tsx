/**
 * /roles/new: create an own role and tick its permissions.
 */
import { ActionForm, PageHeader } from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import { getMe } from '../../../../lib/me';
import type { PermissionResource } from '../../../../lib/types';
import { createRole } from '../actions';
import { RoleFields } from '../role-fields';

export default async function NewRolePage() {
  const [me, resources] = await Promise.all([getMe(), api<PermissionResource[]>('/permissions')]);

  return (
    <>
      <PageHeader back={{ href: '/roles', label: 'Back to roles' }} title="New role" />
      <ActionForm
        action={createRole}
        submitLabel="Create role"
        pendingLabel="Creating…"
        className="gap-6"
      >
        <RoleFields resources={resources} myPermissions={me.permissions} />
      </ActionForm>
    </>
  );
}
