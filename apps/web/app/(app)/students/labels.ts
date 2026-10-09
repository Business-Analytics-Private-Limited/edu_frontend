/**
 * Words shown on screen for the Students module's fixed values.
 */
export const GENDERS = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
  UNDISCLOSED: 'Prefer not to say',
} as const;

/** ACTIVE = a current student; the others are outgoing (ADR-0030). */
export const STUDENT_STATUSES = {
  ACTIVE: 'Current',
  TRANSFERRED: 'Transferred (TC)',
  DISCONTINUED: 'Discontinued',
  COMPLETED: 'Completed',
} as const;

/** How a student can leave: becomes outgoing. */
export const LEAVING_STATUSES = {
  TRANSFERRED: 'Transferred (took a TC)',
  DISCONTINUED: 'Discontinued (dropped out)',
  COMPLETED: 'Completed (finished the final year)',
} as const;

/** A placement's status, for the timeline. */
export const ENROLMENT_STATUSES = {
  ACTIVE: 'Current',
  MOVED: 'Moved',
  PROMOTED: 'Promoted',
  COMPLETED: 'Completed',
  LEFT: 'Left',
} as const;

export const RELATIONS = {
  FATHER: 'Father',
  MOTHER: 'Mother',
  GUARDIAN: 'Guardian',
  OTHER: 'Other',
} as const;
