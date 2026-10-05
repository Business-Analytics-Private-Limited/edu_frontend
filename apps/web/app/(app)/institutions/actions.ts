'use server';
/**
 * Server actions for institutions and their campuses. Institutions themselves are added and
 * deleted by the super admin (ADR-0025); here they can only be renamed.
 * Actions that work on one record get its id first, with .bind() in the page:
 *   <ActionForm action={updateInstitution.bind(null, institution.id)} ... />
 */
import { revalidatePath } from 'next/cache';
import { api, errorMessage } from '../../../lib/api';
import type { FormState } from '../../../lib/types';

// --- Institutions ------------------------------------------------------------------------------

export async function updateInstitution(
  id: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await api(`/institutions/${id}`, {
      method: 'PATCH',
      body: { name: form.get('name') },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath(`/institutions/${id}`);
  return { success: 'Saved' };
}

// --- Campuses ----------------------------------------------------------------------------------

export async function createCampus(
  institutionId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await api(`/institutions/${institutionId}/campuses`, {
      method: 'POST',
      body: { name: form.get('name'), code: form.get('code') },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath(`/institutions/${institutionId}`);
  return { success: 'Campus added' };
}

export async function renameCampus(
  institutionId: string,
  campusId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await api(`/campuses/${campusId}`, { method: 'PATCH', body: { name: form.get('name') } });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath(`/institutions/${institutionId}`);
  return {};
}

export async function deleteCampus(institutionId: string, campusId: string): Promise<FormState> {
  try {
    await api(`/campuses/${campusId}`, { method: 'DELETE' });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath(`/institutions/${institutionId}`);
  return {};
}
