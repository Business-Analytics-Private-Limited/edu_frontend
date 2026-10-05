/**
 * Closed (inactive) campuses and institutions (ADR-0026). Their records can still be read, but
 * nothing new happens there, so screens that START new work (admit, import, move, promote, give
 * a role, add a holiday) only offer places in use:
 *
 *   institutions.flatMap((i) => campusesInUse(i).filter(...))
 *
 * Screens that only SHOW data (classes, attendance, reports) still list closed campuses, marked
 * with placeName(): "Kukatpally · inactive".
 */
import type { Institution, PlaceStatus } from './types';

/** The institution's campuses that are open, or none when the institution itself is closed. */
export function campusesInUse<C extends { status: PlaceStatus }>(institution: {
  status: PlaceStatus;
  campuses: C[];
}): C[] {
  if (institution.status !== 'ACTIVE') return [];
  return institution.campuses.filter((campus) => campus.status === 'ACTIVE');
}

/** A campus's name, with "· inactive" when it or its institution is closed. */
export function placeName(
  campus: { name: string; status: PlaceStatus },
  institution?: Pick<Institution, 'status'>,
): string {
  const closed = campus.status !== 'ACTIVE' || (institution && institution.status !== 'ACTIVE');
  return closed ? `${campus.name} · inactive` : campus.name;
}
