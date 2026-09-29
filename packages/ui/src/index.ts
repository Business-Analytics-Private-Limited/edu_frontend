/** Joins class names, skipping empty values. Components arrive with the Phase 2 web shell. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
