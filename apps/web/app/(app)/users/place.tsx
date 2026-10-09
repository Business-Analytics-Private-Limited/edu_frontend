/**
 * PLACES on the user screens: where a role applies (ADR-0030): the whole organization or one
 * branch. Closed branches are not offered (ADR-0026).
 *
 *   <PlaceSelect branches={branches} me={me} permission="access.user.create" />
 *     a drop-down with only the places where you may add staff; its value is
 *     "" (whole organization) or the branch id (sent as "branchId")
 *   placeLabel(assignment)       "Whole organization" or "KPHB"
 */
import { Field, Select } from '@eduplatform/ui';
import { canAt } from '../../../lib/me';
import type { Branch, Me, Role, RoleAssignment } from '../../../lib/types';

export function PlaceSelect({
  branches,
  me,
  permission,
}: {
  branches: Branch[];
  me: Me;
  permission: string;
}) {
  return (
    <Field label="Where" htmlFor="branchId" hint="The role applies only here">
      <Select id="branchId" name="branchId" required>
        {canAt(me, permission, {}) && <option value="">Whole organization</option>}
        {branches
          .filter((b) => b.status === 'ACTIVE' && canAt(me, permission, { branchId: b.id }))
          .map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
      </Select>
    </Field>
  );
}

/** The roles that can be given here (not Parent / Student) as a drop-down. */
export function RoleSelect({ roles }: { roles: Role[] }) {
  return (
    <Field label="Role" htmlFor="roleId">
      <Select id="roleId" name="roleId" required>
        {roles
          .filter((role) => role.assignable)
          .map((role) => (
            <option key={role.id} value={role.id}>
              {role.predefined ? role.name : `${role.name} (own role)`}
            </option>
          ))}
      </Select>
    </Field>
  );
}

export function placeLabel(assignment: RoleAssignment): string {
  return assignment.branch ? assignment.branch.name : 'Whole organization';
}
