/**
 * The "Roles" checkboxes of the user forms. A user can have several roles (e.g. Principal AND
 * Senior faculty) and may do everything any of them allows.
 *
 * Only roles that can be given here are shown (not Parent / Student, which come from a
 * student's record), and roles with permissions you don't have are locked: you can't hand out
 * more than you have. The API checks both again.
 */
import { Checkbox } from '@eduplatform/ui';
import type { Role } from '../../../lib/types';

export function RoleChoices({
  roles,
  checked,
  myPermissions,
}: {
  roles: Role[];
  checked: string[];
  myPermissions: string[];
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">Roles</legend>
      {roles
        .filter((role) => role.assignable)
        .map((role) => {
          const tooBig = role.permissions.some((p) => !myPermissions.includes(p));
          return (
            <Checkbox
              key={role.id}
              name="roleIds"
              value={role.id}
              label={role.predefined ? role.name : `${role.name} (own role)`}
              description={
                tooBig ? "Has permissions you don't have" : (role.description ?? undefined)
              }
              defaultChecked={checked.includes(role.id)}
              disabled={tooBig}
            />
          );
        })}
    </fieldset>
  );
}
