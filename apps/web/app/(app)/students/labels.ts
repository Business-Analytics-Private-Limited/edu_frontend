/**
 * Words shown on screen for the Students module's fixed values.
 */
export const GENDERS = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
  UNDISCLOSED: 'Prefer not to say',
} as const;

export const STUDENT_STATUSES = {
  ACTIVE: 'Active',
  TRANSFERRED: 'Transferred',
  DISCONTINUED: 'Discontinued',
  ALUMNI: 'Alumni',
} as const;

export const RELATIONS = {
  FATHER: 'Father',
  MOTHER: 'Mother',
  GUARDIAN: 'Guardian',
  OTHER: 'Other',
} as const;

/** "MPC › Section A" from a section and its parent. */
export function sectionLabel(section: { name: string; parent: { name: string } | null }) {
  return section.parent ? `${section.parent.name} › ${section.name}` : section.name;
}
