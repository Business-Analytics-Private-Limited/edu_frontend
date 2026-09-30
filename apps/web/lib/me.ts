/**
 * The logged-in user, and "may they do this?".
 *
 *   const me = await getMe();
 *   can(me, 'access.user.view')                                   // anywhere (menus)
 *   canAt(me, 'platform.campus.update', { institutionId, campusId }) // at this place (buttons)
 *
 * A user's roles each apply at a place: the whole organization, one institution or one campus.
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

/** Does a role given at `grant`'s place also reach `place`? (same rule as the API) */
function covers(grant: Grant, place: Place): boolean {
  if (!grant.institutionId && !grant.campusId) return true; // whole organization
  if (grant.campusId) return place.campusId === grant.campusId;
  return !!place.institutionId && place.institutionId === grant.institutionId;
}
