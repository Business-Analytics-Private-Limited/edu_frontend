/**
 * The fields of an own role, used by "New role" and "Edit role": name, description and the
 * permission grid (View / Create / Edit / Delete per resource).
 * Boxes for permissions you don't have yourself are locked: you can't hand out more than you have.
 */
import { Field, Input, PermissionGrid } from '@eduplatform/ui';
import type { PermissionResource, Role } from '../../../lib/types';

export function RoleFields({
  resources,
  role,
  myPermissions,
}: {
  resources: PermissionResource[];
  role?: Role;
  myPermissions: string[];
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name">
          <Input
            id="name"
            name="name"
            defaultValue={role?.name}
            required
            minLength={2}
            placeholder="Office staff"
          />
        </Field>
        <Field label="Description" htmlFor="description">
          <Input id="description" name="description" defaultValue={role?.description ?? ''} />
        </Field>
      </div>
      <PermissionGrid
        resources={resources}
        checked={role?.permissions ?? []}
        allowed={myPermissions}
      />
    </>
  );
}
