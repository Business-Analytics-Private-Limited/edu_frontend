'use server';
/**
 * The first password change (ADR-0028): the password was set by someone else and must be
 * replaced before anything else. On success, on to the start page.
 */
import { redirect } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import type { FormState } from '../../lib/types';

export async function changeTemporaryPassword(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const newPassword = String(form.get('newPassword') ?? '');
  if (newPassword !== form.get('repeatPassword')) {
    return { error: 'The two new passwords are not the same' };
  }
  try {
    await api('/auth/change-password', {
      method: 'POST',
      body: { currentPassword: form.get('currentPassword'), newPassword },
    });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: 'The server is not reachable. Is the backend running?' };
  }
  redirect('/');
}
