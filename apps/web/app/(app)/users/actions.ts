'use server';
/**
 * Server actions for users: add, rename, deactivate / activate, give and take away roles, reset
 * a forgotten password.
 * A role is always given at a place, chosen in the "Where" drop-down (see place.tsx).
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api, errorMessage } from '../../../lib/api';
import { flash } from '../../../lib/flash';
import type { FormState, ResetPasswordResult, User } from '../../../lib/types';

/** The "Where" drop-down: a branch id, or "" for the whole organization. */
function placeFromForm(form: FormData): { branchId?: string } {
  const branchId = String(form.get('branchId') ?? '');
  return branchId ? { branchId } : {};
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
  await flash('User created');
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
  return { success: 'Role removed' };
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
  return {
    success:
      action === 'deactivate' ? 'User deactivated. They can no longer log in.' : 'User activated',
  };
}

/**
 * A new temporary password for the user (the API makes it, ADR-0036). Returned to the button,
 * which shows it once; they must change it at the next login.
 */
export async function resetPassword(id: string): Promise<ResetPasswordResult> {
  try {
    const result = await api<{ temporaryPassword: string }>(`/users/${id}/reset-password`, {
      method: 'POST',
    });
    return { success: 'Password reset', temporaryPassword: result.temporaryPassword };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
