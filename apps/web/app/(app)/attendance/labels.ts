/**
 * Words and short letters shown for attendance statuses.
 */
import type { AttendanceStatus } from '../../../lib/types';

export const STATUSES: { value: AttendanceStatus; label: string; short: string }[] = [
  { value: 'PRESENT', label: 'Present', short: 'P' },
  { value: 'ABSENT', label: 'Absent', short: 'A' },
  { value: 'LATE', label: 'Late', short: 'L' },
  { value: 'HALF_DAY', label: 'Half day', short: 'H' },
  { value: 'ON_LEAVE', label: 'On leave', short: 'Lv' },
];

export const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.value, s.label])) as Record<
  AttendanceStatus,
  string
>;

/** The day before / after "YYYY-MM-DD". */
export function shiftDay(day: string, by: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + by);
  return d.toISOString().slice(0, 10);
}
