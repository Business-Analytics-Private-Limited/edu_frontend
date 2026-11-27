'use server';
/**
 * Server actions for organizations: what runs on the server when a super admin sends a form
 * (create an organization with its type and branches, change its type / code, switch a module,
 * suspend / activate, add / close / reopen / delete a branch; ADR-0030; reset an admin's
 * password, ADR-0036).
 * Each returns a message for the form to show; on success the page is refreshed.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api, ApiError } from '../../../lib/api';
import { flash } from '../../../lib/flash';
import type { FormState, Organization, ResetPasswordResult } from '../../../lib/types';

/** Text field of a form, or undefined when left empty (so optional fields are left out). */
function text(form: FormData, name: string): string | undefined {
  const value = String(form.get(name) ?? '').trim();
  return value === '' ? undefined : value;
}

/**
 * The branches typed on the "new organization" form: rows branchName1 / branchCode1,
 * branchName2 / ...; empty rows are skipped. Codes are sent in capitals.
 */
function branchesOf(form: FormData): { name?: string; code?: string }[] {
  const rows = [];
  for (let i = 1; form.has(`branchName${i}`); i++) {
    const name = text(form, `branchName${i}`);
    const code = text(form, `branchCode${i}`)?.toUpperCase();
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
        code: text(form, 'code')?.toUpperCase(),
        type: text(form, 'type'),
        contactName: text(form, 'contactName'),
        contactEmail: text(form, 'contactEmail'),
        contactPhone: text(form, 'contactPhone'),
        admin: {
          name: text(form, 'adminName'),
          email: text(form, 'adminEmail'),
          password: text(form, 'adminPassword'),
        },
        branches: branchesOf(form),
      },
    });
  } catch (error) {
    return {
      error: error instanceof ApiError ? error.message : 'Could not create the organization',
    };
  }
  await flash('Organization created');
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
  return { success: enabled ? 'Module switched on' : 'Module switched off' };
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
  return {
    success:
      action === 'suspend'
        ? 'Organization suspended. Its users can no longer log in.'
        : 'Organization activated',
  };
}

export async function addBranch(
  organizationId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await api(`/super-admin/organizations/${organizationId}/branches`, {
      method: 'POST',
      body: { name: text(form, 'name'), code: text(form, 'code')?.toUpperCase() },
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : 'Could not add the branch' };
  }
  revalidatePath(`/organizations/${organizationId}`);
  return { success: 'Branch added' };
}

export async function deleteBranch(organizationId: string, branchId: string): Promise<FormState> {
  try {
    await api(`/super-admin/organizations/${organizationId}/branches/${branchId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : 'Could not delete the branch' };
  }
  revalidatePath(`/organizations/${organizationId}`);
  return { success: 'Branch deleted' };
}

/** Closes or reopens a branch (ADR-0026). */
export async function setBranchStatus(
  organizationId: string,
  branchId: string,
  action: 'deactivate' | 'activate',
): Promise<FormState> {
  try {
    await api(`/super-admin/organizations/${organizationId}/branches/${branchId}/${action}`, {
      method: 'POST',
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : `Could not ${action} it` };
  }
  revalidatePath(`/organizations/${organizationId}`);
  return { success: action === 'deactivate' ? 'Branch closed' : 'Branch opened again' };
}

/** The organization's name, code and type (the type only while it has no structure yet). */
export async function updateOrganization(
  organizationId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await api(`/super-admin/organizations/${organizationId}`, {
      method: 'PATCH',
      body: {
        name: text(form, 'name'),
        code: text(form, 'code')?.toUpperCase(),
        type: text(form, 'type'),
      },
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : 'Could not save' };
  }
  revalidatePath(`/organizations/${organizationId}`);
  return { success: 'Saved' };
}

/**
 * A new temporary password for one of the organization's admins (the API makes it, ADR-0036),
 * e.g. when the only admin forgot theirs. The button shows it once.
 */
export async function resetAdminPassword(
  organizationId: string,
  userId: string,
): Promise<ResetPasswordResult> {
  try {
    const result = await api<{ temporaryPassword: string }>(
      `/super-admin/organizations/${organizationId}/admins/${userId}/reset-password`,
      { method: 'POST' },
    );
    return { success: 'Password reset', temporaryPassword: result.temporaryPassword };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : 'Could not reset the password' };
  }
}
