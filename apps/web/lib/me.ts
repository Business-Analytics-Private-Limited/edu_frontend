/**
 * The logged-in user, and "may they do this?".
 *
 *   const me = await getMe();
 *   can(me, 'access.user.view')                                  // anywhere (menus)
 *   canAt(me, 'students.student.update', { branchId })            // at this branch (buttons)
 *   canAt(me, 'academic.year.create', {})                         // for the whole organization
 *
 * A user's roles each apply at a place: the whole organization or one branch (ADR-0030).
 * getMe() asks the API once per page load (React's cache), however many components call it.
 * Hiding buttons is only for a clean screen: the API checks every permission again.
 */
import 'server-only';
import { cache } from 'react';
import { api } from './api';
import type { Grant, Me, Place } from './types';

export const getMe = cache(() => api<Me>('/auth/me'));

/** Does the user have the permission somewhere? (Enough to show a menu item.) */
export function can(me: Me, permission: string): boolean {
  return me.permissions.includes(permission);
}

/** Does the user have the permission at this place? ({} = the whole organization) */
export function canAt(me: Me, permission: string, place: Place): boolean {
  return me.grants.some((g) => g.permissions.includes(permission) && covers(g, place));
}

/** The branches where the user has the permission, or "all" (whole organization). */
export function branchesWith(me: Me, permission: string): 'all' | string[] {
  const grants = me.grants.filter((g) => g.permissions.includes(permission));
  if (grants.some((g) => !g.branchId)) return 'all';
  return [...new Set(grants.map((g) => g.branchId!))];
}

/** Does a role given at `grant`'s place also reach `place`? (same rule as the API) */
function covers(grant: Grant, place: Place): boolean {
  if (!grant.branchId) return true; // whole organization
  return !!place.branchId && place.branchId === grant.branchId;
}
