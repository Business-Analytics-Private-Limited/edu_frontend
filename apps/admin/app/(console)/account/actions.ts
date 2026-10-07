'use server';
/**
 * Server actions for the super admin's Account page: change the password, and two-step login
 * (set up, confirm with a code, turn off; ADR-0028).
 */
import { revalidatePath } from 'next/cache';
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

function failed(error: unknown, fallback: string): FormState {
  return { error: error instanceof ApiError ? error.message : fallback };
}

/** Creates a new secret; the page then shows its QR code. */
export async function startTwoFactor(): Promise<FormState> {
  try {
    await api('/auth/two-factor/setup', { method: 'POST' });
  } catch (error) {
    return failed(error, 'Could not start the setup');
  }
  revalidatePath('/account');
  return {};
}

export async function enableTwoFactor(_previous: FormState, form: FormData): Promise<FormState> {
  try {
    await api('/auth/two-factor/enable', {
      method: 'POST',
      body: { code: String(form.get('code') ?? '').trim() },
    });
  } catch (error) {
    return failed(error, 'Could not turn on two-step login');
  }
  revalidatePath('/', 'layout');
  return { success: 'Two-step login is on' };
}

export async function disableTwoFactor(_previous: FormState, form: FormData): Promise<FormState> {
  try {
    await api('/auth/two-factor/disable', {
      method: 'POST',
      body: { password: form.get('password'), code: String(form.get('code') ?? '').trim() },
    });
  } catch (error) {
    return failed(error, 'Could not turn off two-step login');
  }
  revalidatePath('/', 'layout');
  return { success: 'Two-step login is off' };
}
