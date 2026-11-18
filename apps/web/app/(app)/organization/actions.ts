'use server';
/**
 * Server action for the organization page: save the contact details.
 */
import { revalidatePath } from 'next/cache';
import { api, errorMessage } from '../../../lib/api';
import type { FormState } from '../../../lib/types';

export async function updateOrganization(_previous: FormState, form: FormData): Promise<FormState> {
  try {
    await api('/organization', {
      method: 'PATCH',
      body: {
        contactName: String(form.get('contactName') ?? ''),
        contactEmail: String(form.get('contactEmail') ?? '') || undefined, // empty is not an email
        contactPhone: String(form.get('contactPhone') ?? ''),
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/organization');
  return { success: 'Saved' };
}
