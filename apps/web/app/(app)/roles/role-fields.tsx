/**
 * The fields of a role, used by "New role" and "Edit role": name, description and one
 * checkbox per permission, grouped (Organization, Users and roles, Students, ...).
 * Permissions of modules the organization doesn't have are shown but can't be ticked.
 */
import { Checkbox, Field, Input } from '@eduplatform/ui';
import type { Permission, Role } from '../../../lib/types';

export function RoleFields({ permissions, role }: { permissions: Permission[]; role?: Role }) {
  // { "Organization": [...], "Students": [...] } in the order of the list.
  const groups = new Map<string, Permission[]>();
  for (const permission of permissions) {
    groups.set(permission.group, [...(groups.get(permission.group) ?? []), permission]);
  }

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
            placeholder="Teacher"
          />
        </Field>
        <Field label="Description" htmlFor="description">
          <Input id="description" name="description" defaultValue={role?.description ?? ''} />
        </Field>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[...groups].map(([group, items]) => (
          <fieldset key={group} className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold">{group}</legend>
            {items.map((permission) => (
              <Checkbox
                key={permission.key}
                name="permissions"
                value={permission.key}
                label={permission.description}
                description={
                  permission.available ? permission.key : `${permission.key} (module not active)`
                }
                defaultChecked={role?.permissions.includes(permission.key)}
                disabled={!permission.available}
              />
            ))}
          </fieldset>
        ))}
      </div>
    </>
  );
}
