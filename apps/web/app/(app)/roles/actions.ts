'use server';
/**
 * Server actions for roles. The ticked permission checkboxes all have name="permissions",
 * so form.getAll('permissions') gives the list of permission keys.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api, errorMessage } from '../../../lib/api';
import type { FormState, Role } from '../../../lib/types';

function roleFromForm(form: FormData) {
  return {
    name: form.get('name'),
    description: form.get('description'),
    permissions: form.getAll('permissions'),
  };
}

export async function createRole(_previous: FormState, form: FormData): Promise<FormState> {
  let role: Role;
  try {
    role = await api<Role>('/roles', { method: 'POST', body: roleFromForm(form) });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  redirect(`/roles/${role.id}`);
}

export async function updateRole(
  id: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await api(`/roles/${id}`, { method: 'PATCH', body: roleFromForm(form) });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath(`/roles/${id}`);
  return { success: 'Saved' };
}

export async function deleteRole(id: string): Promise<FormState> {
  try {
    await api(`/roles/${id}`, { method: 'DELETE' });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  redirect('/roles');
}

/** A predefined role: only its permissions change (ADR-0029); it becomes "customized". */
export async function updatePredefinedRole(
  id: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await api(`/roles/${id}`, {
      method: 'PATCH',
      body: { permissions: form.getAll('permissions') },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath(`/roles/${id}`);
  return { success: 'Saved. This role now keeps your permissions when EduPlatform changes it.' };
}

/** Back to EduPlatform's version of a predefined role. */
export async function resetRole(id: string): Promise<FormState> {
  try {
    await api(`/roles/${id}/reset`, { method: 'POST' });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath(`/roles/${id}`);
  return {};
}
