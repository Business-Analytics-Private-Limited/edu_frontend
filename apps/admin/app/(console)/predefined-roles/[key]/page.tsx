/**
 * /predefined-roles/:key: tick the permissions of one predefined role. Saving changes that
 * role in every organization. The Organization admin always has everything, so it is read-only.
 */
import { ActionForm, PageHeader, PermissionGrid } from '@eduplatform/ui';
import { notFound } from 'next/navigation';
import { api } from '../../../../lib/api';
import type { PermissionResource, PredefinedRole } from '../../../../lib/types';
import { resetPredefinedRole, updatePredefinedRole } from '../actions';

export default async function PredefinedRolePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const [roles, resources] = await Promise.all([
    api<PredefinedRole[]>('/super-admin/predefined-roles'),
    api<PermissionResource[]>('/super-admin/permissions'),
  ]);
  const role = roles.find((r) => r.key === key);
  if (!role) notFound();

  if (role.key === 'org_admin') {
    return (
      <>
        <PageHeader
          title={role.name}
          description="Always has every permission, so every organization can manage itself."
        />
        <PermissionGrid resources={resources} checked={role.permissions} readOnly />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={role.name}
        description={role.description}
        actions={
          <ActionForm
            action={resetPredefinedRole.bind(null, role.key)}
            submitLabel="Reset to EduPlatform defaults"
            pendingLabel="Resetting…"
            confirmMessage={`Put ${role.name} back to EduPlatform's starting permissions, in every organization?`}
            submitVariant="outline"
            submitSize="sm"
          />
        }
      />
      <ActionForm
        action={updatePredefinedRole.bind(null, role.key)}
        submitLabel="Save for every organization"
        confirmMessage={`Change the ${role.name} role in every organization?`}
        className="gap-6"
      >
        <PermissionGrid resources={resources} checked={role.permissions} />
      </ActionForm>
    </>
  );
}
