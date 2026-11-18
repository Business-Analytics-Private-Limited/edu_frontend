/**
 * /predefined-roles/new: the super admin creates a predefined role (ADR-0030), e.g.
 * "Accountant" with some basic permissions. Every organization gets a copy at once, which it may
 * then customize for itself.
 */
import {
  ActionForm,
  Card,
  CardContent,
  Field,
  Input,
  PageHeader,
  PermissionGrid,
} from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import type { PermissionResource } from '../../../../lib/types';
import { createPredefinedRole } from '../actions';

export default async function NewPredefinedRolePage() {
  const resources = await api<PermissionResource[]>('/super-admin/permissions');
  return (
    <>
      <PageHeader
        back={{ href: '/predefined-roles', label: 'Back to predefined roles' }}
        title="New predefined role"
        description="Every organization gets it at once; each can change its own copy later."
      />
      <ActionForm
        action={createPredefinedRole}
        submitLabel="Create for every organization"
        confirmMessage="Create this role in every organization?"
        className="gap-6"
      >
        <Card className="max-w-2xl">
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <Field label="Name" htmlFor="name">
              <Input id="name" name="name" required minLength={2} placeholder="Accountant" />
            </Field>
            <Field label="Description" htmlFor="description">
              <Input id="description" name="description" required placeholder="Fees and receipts" />
            </Field>
          </CardContent>
        </Card>
        <PermissionGrid resources={resources} checked={[]} />
      </ActionForm>
    </>
  );
}
