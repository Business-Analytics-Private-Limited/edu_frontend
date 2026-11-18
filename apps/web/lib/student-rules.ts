/**
 * The rules for a student's details, for checking in the BROWSER before the form is sent
 * (ADR-0031). The API checks the same rules again and decides (eduplatform-backend
 * src/modules/students/student-rules.ts); keep the two the same.
 *
 *   <Input name="phone" pattern={PHONE_PATTERN} title={PHONE_TITLE} />   (HTML checks it)
 *   isValidAadhaar('234567890124')                                     (the check digit)
 */

/**
 * Letters, spaces, . ' and - ; starts with a letter. For the HTML `pattern` attribute, which
 * browsers read in the strict "v" regex mode: - and / inside [...] need a backslash.
 */
export const NAME_PATTERN = String.raw`[A-Za-z][A-Za-z .'’\-]*`;
export const NAME_TITLE = 'Letters, spaces, dots, apostrophes and hyphens only';

/** A 10-digit mobile number starting with 6-9 (spaces and +91 are removed by the API). */
export const PHONE_PATTERN = String.raw`(\+?91[ \-]?)?[6-9][0-9]{4}[ \-]?[0-9]{5}`;
export const PHONE_TITLE = '10-digit mobile number starting with 6, 7, 8 or 9';

/** Hall ticket and test numbers. */
export const CODE_PATTERN = String.raw`[A-Za-z0-9\/\-]+`;
export const CODE_TITLE = 'Letters, digits, / and - only';

export const ADMISSION_NO_PATTERN = String.raw`[A-Za-z0-9_\/\-]+`;
export const ADMISSION_NO_TITLE = 'Letters, digits, /, _ and - only';

export const MIN_AGE = 3;
export const MAX_AGE = 30;

// The Verhoeff check digit, as used by Aadhaar.
const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

/** 12 digits (spaces allowed), not starting with 0 or 1, with the right check digit. */
export function isValidAadhaar(value: string): boolean {
  const digits = value.replace(/[\s-]/g, '');
  if (!/^[2-9]\d{11}$/.test(digits)) return false;
  let c = 0;
  digits
    .split('')
    .reverse()
    .map(Number)
    .forEach((digit, i) => {
      c = D[c][P[i % 8][digit]];
    });
  return c === 0;
}

/** YYYY-MM-DD of the latest and earliest birth dates for a student admitted on `admittedOn`. */
export function birthDateRange(admittedOn: string): { min: string; max: string } {
  const day = new Date(`${admittedOn}T00:00:00Z`);
  const shift = (years: number) => {
    const d = new Date(day);
    d.setUTCFullYear(d.getUTCFullYear() - years);
    return d.toISOString().slice(0, 10);
  };
  return { min: shift(MAX_AGE + 1), max: shift(MIN_AGE) };
}
