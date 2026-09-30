'use server';
/**
 * Server action for the super admin's "Change password" page.
 */
import { api, ApiError } from '../../../lib/api';
import type { FormState } from '../../../lib/types';

export async function changePassword(_previous: FormState, form: FormData): Promise<FormState> {
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
    return { error: error instanceof ApiError ? error.message : 'Could not change the password' };
  }
  return { success: 'Password changed' };
}
