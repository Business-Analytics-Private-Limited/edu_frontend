/**
 * The logged-in user, and "may they do this?".
 *
 *   const me = await getMe();
 *   if (can(me, 'access.user.manage')) { ...show the "Add user" button... }
 *
 * getMe() asks the API once per page load (React's cache), however many components call it.
 * Hiding buttons is only for a clean screen: the API checks every permission again.
 */
import 'server-only';
import { cache } from 'react';
import { api } from './api';
import type { Me } from './types';

export const getMe = cache(() => api<Me>('/auth/me'));

export function can(me: Me, permission: string): boolean {
  return me.permissions.includes(permission);
}
