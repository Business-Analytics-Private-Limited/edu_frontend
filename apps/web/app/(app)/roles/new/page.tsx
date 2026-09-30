/**
 * /roles/new: create a role and tick its permissions.
 */
import { ActionForm, PageHeader } from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import type { Permission } from '../../../../lib/types';
import { createRole } from '../actions';
import { RoleFields } from '../role-fields';

export default async function NewRolePage() {
  const permissions = await api<Permission[]>('/permissions');

  return (
    <>
      <PageHeader title="New role" />
      <ActionForm
        action={createRole}
        submitLabel="Create role"
        pendingLabel="Creating…"
        className="gap-6"
      >
        <RoleFields permissions={permissions} />
      </ActionForm>
    </>
  );
}
