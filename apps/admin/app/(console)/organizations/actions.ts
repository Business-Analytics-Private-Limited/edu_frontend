'use server';
/**
 * Server actions for organizations: what runs on the server when a super admin sends a form
 * (create an organization, switch a module, suspend / activate, add or delete an institution).
 * Each returns a message for the form to show; on success the page is refreshed.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api, ApiError } from '../../../lib/api';
import type { FormState, Organization } from '../../../lib/types';

/** Text field of a form, or undefined when left empty (so optional fields are left out). */
function text(form: FormData, name: string): string | undefined {
  const value = String(form.get(name) ?? '').trim();
  return value === '' ? undefined : value;
}

/**
 * The institutions typed on the "new organization" form: rows institutionName1 / institutionCode1,
 * institutionName2 / ...; empty rows are skipped. Codes are sent in capitals.
 */
function institutionsOf(form: FormData): { name?: string; code?: string }[] {
  const rows = [];
  for (let i = 1; form.has(`institutionName${i}`); i++) {
    const name = text(form, `institutionName${i}`);
    const code = text(form, `institutionCode${i}`)?.toUpperCase();
    if (name || code) rows.push({ name, code });
  }
  return rows;
}

export async function createOrganization(_previous: FormState, form: FormData): Promise<FormState> {
  let created: Organization;
  try {
    created = await api<Organization>('/super-admin/organizations', {
      method: 'POST',
      body: {
        name: text(form, 'name'),
        slug: text(form, 'slug'),
        contactName: text(form, 'contactName'),
        contactEmail: text(form, 'contactEmail'),
        contactPhone: text(form, 'contactPhone'),
        admin: {
          name: text(form, 'adminName'),
          email: text(form, 'adminEmail'),
          password: text(form, 'adminPassword'),
        },
        institutions: institutionsOf(form),
      },
    });
  } catch (error) {
    return {
      error: error instanceof ApiError ? error.message : 'Could not create the organization',
    };
  }
  redirect(`/organizations/${created.id}`);
}

export async function setModule(
  organizationId: string,
  moduleKey: string,
  enabled: boolean,
): Promise<FormState> {
  try {
    await api(`/super-admin/organizations/${organizationId}/modules/${moduleKey}`, {
      method: 'PUT',
      body: { enabled },
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : 'Could not change the module' };
  }
  revalidatePath(`/organizations/${organizationId}`);
  return {};
}

export async function setStatus(
  organizationId: string,
  action: 'suspend' | 'activate',
): Promise<FormState> {
  try {
    await api(`/super-admin/organizations/${organizationId}/${action}`, { method: 'POST' });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : 'Could not change the status' };
  }
  revalidatePath(`/organizations/${organizationId}`);
  return {};
}

export async function addInstitution(
  organizationId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await api(`/super-admin/organizations/${organizationId}/institutions`, {
      method: 'POST',
      body: { name: text(form, 'name'), code: text(form, 'code')?.toUpperCase() },
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : 'Could not add the institution' };
  }
  revalidatePath(`/organizations/${organizationId}`);
  return { success: 'Institution added' };
}

export async function deleteInstitution(
  organizationId: string,
  institutionId: string,
): Promise<FormState> {
  try {
    await api(`/super-admin/organizations/${organizationId}/institutions/${institutionId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    return {
      error: error instanceof ApiError ? error.message : 'Could not delete the institution',
    };
  }
  revalidatePath(`/organizations/${organizationId}`);
  return {};
}

/** Closes or reopens an institution (ADR-0026). */
export async function setInstitutionStatus(
  organizationId: string,
  institutionId: string,
  action: 'deactivate' | 'activate',
): Promise<FormState> {
  try {
    await api(
      `/super-admin/organizations/${organizationId}/institutions/${institutionId}/${action}`,
      {
        method: 'POST',
      },
    );
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : `Could not ${action} it` };
  }
  revalidatePath(`/organizations/${organizationId}`);
  return {};
}
