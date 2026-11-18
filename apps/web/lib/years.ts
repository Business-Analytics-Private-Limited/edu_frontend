/**
 * Which academic year a year list in a form starts on.
 *
 *   <Select name="academicYearId" required defaultValue={startingYearId(openYears) ?? ''}>
 *     {!startingYearId(openYears) && <option value="">Choose the year…</option>}
 *
 * The current year (ACTIVE); else the open year that includes today; else, when only one year
 * is open, that one; else none, and the user must choose. Never simply the first in the list:
 * the API lists the newest year first, so while no year is marked current, students would
 * quietly go into NEXT year (an import into 2027-28 in November 2026).
 */
import type { AcademicYear } from './types';

export function startingYearId(years: AcademicYear[]): string | undefined {
  const today = new Date().toISOString().slice(0, 10);
  const open = years.filter((y) => y.status !== 'CLOSED');
  return (
    open.find((y) => y.status === 'ACTIVE') ??
    open.find((y) => y.startsOn.slice(0, 10) <= today && today <= y.endsOn.slice(0, 10)) ??
    (open.length === 1 ? open[0] : undefined)
  )?.id;
}
