'use server';
/**
 * Server action for a predefined role: save its permissions. The API writes them to that
 * role in every organization at once.
 */
import { revalidatePath } from 'next/cache';
import { api, ApiError } from '../../../lib/api';
import type { FormState } from '../../../lib/types';

export async function updatePredefinedRole(
  key: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await api(`/super-admin/predefined-roles/${key}`, {
      method: 'PUT',
      body: { permissions: form.getAll('permissions') },
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : 'Could not save' };
  }
  revalidatePath('/predefined-roles');
  return { success: 'Saved for every organization' };
}

/** Back to EduPlatform's starting permissions for this role (e.g. after a new version). */
export async function resetPredefinedRole(key: string): Promise<FormState> {
  try {
    await api(`/super-admin/predefined-roles/${key}/reset`, { method: 'POST' });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : 'Could not reset' };
  }
  revalidatePath('/predefined-roles');
  revalidatePath(`/predefined-roles/${key}`);
  return { success: 'Reset for every organization' };
}
