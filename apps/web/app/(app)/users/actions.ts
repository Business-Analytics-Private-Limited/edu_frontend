'use server';
/**
 * Server actions for users: add, edit (name and role), deactivate / activate.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api, errorMessage } from '../../../lib/api';
import type { FormState, User } from '../../../lib/types';

export async function createUser(_previous: FormState, form: FormData): Promise<FormState> {
  let user: User;
  try {
    user = await api<User>('/users', {
      method: 'POST',
      body: {
        name: form.get('name'),
        email: form.get('email'),
        password: form.get('password'),
        roleId: form.get('roleId'),
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  redirect(`/users/${user.id}`);
}

export async function updateUser(
  id: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await api(`/users/${id}`, {
      method: 'PATCH',
      body: { name: form.get('name'), roleId: form.get('roleId') },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath(`/users/${id}`);
  return { success: 'Saved' };
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
