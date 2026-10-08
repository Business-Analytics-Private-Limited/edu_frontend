/**
 * A message for the NEXT page, from a server action that redirects ("Student admitted" after
 * the form opens the new student). The action can't open an alert itself because the page
 * changes; it leaves the message in a short-lived cookie, and <AlertHost> (app/layout.tsx) shows it
 * on the next page and deletes it.
 *
 *   await flash('Role created');
 *   redirect(`/roles/${role.id}`);
 *
 * Not secret (only the message text), so the browser may read it. Each app has its own cookie
 * name: both run on "localhost", which shares cookies between ports.
 */
import type { NotifyVariant } from '@eduplatform/ui';
import { cookies } from 'next/headers';

export const FLASH_COOKIE = 'eduplatform_flash';

export async function flash(message: string, variant: NotifyVariant = 'success') {
  (await cookies()).set(FLASH_COOKIE, JSON.stringify({ message, variant }), {
    path: '/',
    maxAge: 60,
    sameSite: 'lax',
  });
}
