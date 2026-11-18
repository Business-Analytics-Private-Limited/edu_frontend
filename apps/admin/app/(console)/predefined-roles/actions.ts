'use server';
/**
 * Server actions for predefined roles: create one (every organization gets a copy, ADR-0030),
 * save its permissions (written to every organization that hasn't customized it), reset a
 * built-in role, delete one created here while nobody has it.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api, ApiError } from '../../../lib/api';
import { flash } from '../../../lib/flash';
import type { FormState, PredefinedRole } from '../../../lib/types';

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

/** A new predefined role: name, description and the ticked permissions. */
export async function createPredefinedRole(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  let created: PredefinedRole;
  try {
    created = await api<PredefinedRole>('/super-admin/predefined-roles', {
      method: 'POST',
      body: {
        name: String(form.get('name') ?? '').trim(),
        description: String(form.get('description') ?? '').trim(),
        permissions: form.getAll('permissions'),
      },
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : 'Could not create the role' };
  }
  await flash('Role created; every organization has it now');
  redirect(`/predefined-roles/${created.key}`);
}

/** Only a role created here, and only while no user in any organization has it. */
export async function deletePredefinedRole(key: string): Promise<FormState> {
  try {
    await api(`/super-admin/predefined-roles/${key}`, { method: 'DELETE' });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : 'Could not delete the role' };
  }
  await flash('Role deleted from every organization');
  redirect('/predefined-roles');
}
