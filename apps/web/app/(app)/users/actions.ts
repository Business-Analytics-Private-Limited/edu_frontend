'use server';
/**
 * Server actions for users: add, rename, deactivate / activate, give and take away roles.
 * A role is always given at a place, chosen in the "Where" drop-down (see place.tsx).
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api, errorMessage } from '../../../lib/api';
import type { FormState, User } from '../../../lib/types';

/** The "Where" drop-down value -> what the API expects. "" = the whole organization. */
function placeFromForm(form: FormData): { institutionId?: string; campusId?: string } {
  const [kind, id] = String(form.get('place') ?? '').split(':');
  if (kind === 'institution') return { institutionId: id };
  if (kind === 'campus') return { campusId: id };
  return {};
}

export async function createUser(_previous: FormState, form: FormData): Promise<FormState> {
  let user: User;
  try {
    user = await api<User>('/users', {
      method: 'POST',
      body: {
        name: form.get('name'),
        email: form.get('email'),
        password: form.get('password'),
        roles: [{ roleId: form.get('roleId'), ...placeFromForm(form) }],
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  redirect(`/users/${user.id}`);
}

export async function renameUser(
  id: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await api(`/users/${id}`, { method: 'PATCH', body: { name: form.get('name') } });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath(`/users/${id}`);
  return { success: 'Saved' };
}

export async function addRole(
  id: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await api(`/users/${id}/roles`, {
      method: 'POST',
      body: { roleId: form.get('roleId'), ...placeFromForm(form) },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath(`/users/${id}`);
  return { success: 'Role added' };
}

export async function removeRole(id: string, assignmentId: string): Promise<FormState> {
  try {
    await api(`/users/${id}/roles/${assignmentId}`, { method: 'DELETE' });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath(`/users/${id}`);
  return {};
}

export async function setUserStatus(
  id: string,
  action: 'deactivate' | 'activate',
): Promise<FormState> {
  try {
    await api(`/users/${id}/${action}`, { method: 'POST' });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath(`/users/${id}`);
  return {};
}
