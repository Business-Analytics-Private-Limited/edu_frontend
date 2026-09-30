'use server';
/**
 * Server actions for institutions and their campuses.
 * Actions that work on one record get its id first, with .bind() in the page:
 *   <ActionForm action={updateInstitution.bind(null, institution.id)} ... />
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api, errorMessage } from '../../../lib/api';
import type { FormState } from '../../../lib/types';

// --- Institutions ------------------------------------------------------------------------------

export async function createInstitution(_previous: FormState, form: FormData): Promise<FormState> {
  try {
    await api('/institutions', {
      method: 'POST',
      body: { name: form.get('name'), code: form.get('code'), type: form.get('type') },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/institutions');
  return { success: 'Institution added' };
}

export async function updateInstitution(
  id: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await api(`/institutions/${id}`, {
      method: 'PATCH',
      body: { name: form.get('name'), type: form.get('type') },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath(`/institutions/${id}`);
  return { success: 'Saved' };
}

export async function deleteInstitution(id: string): Promise<FormState> {
  try {
    await api(`/institutions/${id}`, { method: 'DELETE' });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  redirect('/institutions');
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
