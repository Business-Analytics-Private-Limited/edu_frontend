/**
 * PLACES on the user screens: where a role applies (the whole organization, one institution or
 * one campus).
 *
 *   <PlaceSelect institutions={institutions} me={me} permission="access.user.create" />
 *     a drop-down with only the places where you may add staff; its value is
 *     ""  (whole organization), "institution:<id>" or "campus:<id>"
 *   placeLabel(assignment)       "Whole organization", "Sri Vidya JC" or "Kukatpally (Sri Vidya JC)"
 *
 * The server actions turn the drop-down value back into { institutionId } / { campusId } with
 * placeFromForm() in actions.ts.
 */
import { Field, Select } from '@eduplatform/ui';
import { canAt } from '../../../lib/me';
import type { Institution, Me, Role, RoleAssignment } from '../../../lib/types';

export function PlaceSelect({
  institutions,
  me,
  permission,
}: {
  institutions: Institution[];
  me: Me;
  permission: string;
}) {
  return (
    <Field label="Where" htmlFor="place" hint="The role applies only here">
      <Select id="place" name="place" required>
        {canAt(me, permission, {}) && <option value="">Whole organization</option>}
        {institutions.map((institution) => (
          <optgroup key={institution.id} label={institution.name}>
            {canAt(me, permission, { institutionId: institution.id }) && (
              <option value={`institution:${institution.id}`}>
                {institution.name} (all campuses)
              </option>
            )}
            {institution.campuses
              .filter((campus) =>
                canAt(me, permission, { institutionId: institution.id, campusId: campus.id }),
              )
              .map((campus) => (
                <option key={campus.id} value={`campus:${campus.id}`}>
                  {campus.name}
                </option>
              ))}
          </optgroup>
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
  if (assignment.campus) {
    return assignment.institution
      ? `${assignment.campus.name} (${assignment.institution.name})`
      : assignment.campus.name;
  }
  if (assignment.institution) return assignment.institution.name;
  return 'Whole organization';
}
