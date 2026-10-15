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
  MOVED: 'Shuffled',
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

/** Reservation category (SENSITIVE, ADR-0031). */
export const CATEGORIES = {
  OC: 'OC',
  BC_A: 'BC-A',
  BC_B: 'BC-B',
  BC_C: 'BC-C',
  BC_D: 'BC-D',
  BC_E: 'BC-E',
  SC: 'SC',
  ST: 'ST',
  EWS: 'EWS',
  OTHER: 'Other',
} as const;

export const RESIDENCES = {
  DAY_SCHOLAR: 'Day scholar',
  HOSTELLER: 'Hosteller',
} as const;

/** The board of the previous exam. */
export const BOARDS = {
  SSC: 'SSC (State board, class 10)',
  CBSE: 'CBSE',
  ICSE: 'ICSE',
  INTERMEDIATE: 'Intermediate (State board, class 12)',
  IB: 'IB',
  OTHER: 'Other',
} as const;

/** Top rankers' level (ADR-0031). */
export const LEARNER_LEVELS = {
  EXPERT: 'Expert',
  MEDIUM: 'Medium learner',
  SLOW: 'Slow learner',
} as const;

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
