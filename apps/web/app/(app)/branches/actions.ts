'use server';
/**
 * Server actions for branches. Branches are added, closed and deleted by EduPlatform (the super
 * admin, ADR-0030); here they can only be renamed.
 *   <ActionForm action={renameBranch.bind(null, branch.id)} ... />
 */
import { revalidatePath } from 'next/cache';
import { api, errorMessage } from '../../../lib/api';
import type { FormState } from '../../../lib/types';

export async function renameBranch(
  id: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await api(`/branches/${id}`, { method: 'PATCH', body: { name: form.get('name') } });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath(`/branches/${id}`);
  return { success: 'Branch renamed' };
}
