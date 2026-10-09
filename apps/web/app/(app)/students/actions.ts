'use server';
/**
 * Server actions for the Students screens (ADR-0030): admission, profile, leaving and
 * re-admission, section and branch changes, guardians, placements, promotion, import, admission
 * numbers, portal logins and documents. Each calls the API and returns a message for the form;
 * the API checks every permission at the student's branch again.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api, apiUpload, errorMessage } from '../../../lib/api';
import { flash } from '../../../lib/flash';
import { parseCsv } from '../../../lib/csv';
import type { FormState, StudentProfile } from '../../../lib/types';

/** A text field, or undefined when left empty (so optional fields are left out). */
function text(form: FormData, name: string): string | undefined {
  const value = String(form.get(name) ?? '').trim();
  return value === '' ? undefined : value;
}

/** Runs an API call for one student's page, refreshes it, and says what happened. */
async function forStudent(id: string, call: () => Promise<unknown>, success: string) {
  try {
    await call();
  } catch (error) {
    return { error: errorMessage(error) } satisfies FormState;
  }
  revalidatePath(`/students/${id}`);
  return { success } satisfies FormState;
}

export async function admitStudent(_previous: FormState, form: FormData): Promise<FormState> {
  const sectionId = text(form, 'classId');
  const academicYearId = text(form, 'academicYearId');
  const guardianName = text(form, 'guardianName');
  let student: StudentProfile;
  try {
    student = await api<StudentProfile>('/students', {
      method: 'POST',
      body: {
        branchId: text(form, 'branchId'),
        admissionNo: text(form, 'admissionNo'),
        admissionDate: text(form, 'admissionDate'),
        fullName: text(form, 'fullName'),
        surname: text(form, 'surname'),
        dateOfBirth: text(form, 'dateOfBirth'),
        gender: text(form, 'gender'),
        phone: text(form, 'phone'),
        email: text(form, 'email'),
        address: text(form, 'address'),
        previousInstitution: text(form, 'previousInstitution'),
        previousMarks: text(form, 'previousMarks'),
        enrolment:
          sectionId && academicYearId
            ? { academicYearId, classId: sectionId, rollNo: text(form, 'rollNo') }
            : undefined,
        guardians: guardianName
          ? [
              {
                fullName: guardianName,
                relation: text(form, 'guardianRelation'),
                phone: text(form, 'guardianPhone'),
              },
            ]
          : undefined,
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  await flash('Student admitted');
  redirect(`/students/${student.id}`);
}

export async function updateStudent(id: string, _previous: FormState, form: FormData) {
  return forStudent(
    id,
    () =>
      api(`/students/${id}`, {
        method: 'PATCH',
        body: {
          fullName: text(form, 'fullName'),
          surname: text(form, 'surname'),
          dateOfBirth: text(form, 'dateOfBirth'),
          gender: text(form, 'gender'),
          bloodGroup: text(form, 'bloodGroup'),
          phone: text(form, 'phone'),
          email: text(form, 'email'),
          address: text(form, 'address'),
          previousInstitution: text(form, 'previousInstitution'),
          previousMarks: text(form, 'previousMarks'),
          admissionNo: text(form, 'admissionNo'),
        },
      }),
    'Saved',
  );
}

/** The student leaves: becomes outgoing (transferred, discontinued or completed). */
export async function leaveStudent(id: string, _previous: FormState, form: FormData) {
  return forStudent(
    id,
    () =>
      api(`/students/${id}/leave`, {
        method: 'POST',
        body: {
          status: text(form, 'status'),
          effectiveOn: text(form, 'effectiveOn'),
          reason: text(form, 'reason'),
          destination: text(form, 'destination'),
        },
      }),
    'The student is now outgoing. Their records are kept.',
  );
}

export async function readmitStudent(id: string, _previous: FormState, form: FormData) {
  return forStudent(
    id,
    () =>
      api(`/students/${id}/readmit`, {
        method: 'POST',
        body: { effectiveOn: text(form, 'effectiveOn'), reason: text(form, 'reason') },
      }),
    'Re-admitted. Now place them in a section.',
  );
}

/** Another section of the same branch, from a date (the section picker sends "classId"). */
export async function changeSection(id: string, _previous: FormState, form: FormData) {
  return forStudent(
    id,
    () =>
      api(`/students/${id}/change-section`, {
        method: 'POST',
        body: {
          classId: text(form, 'classId'),
          effectiveOn: text(form, 'effectiveOn'),
          reason: text(form, 'reason'),
          rollNo: text(form, 'rollNo'),
        },
      }),
    'Section changed; the old one stays in the history',
  );
}

/** Another branch and a section there, from a date. */
export async function changeBranch(id: string, _previous: FormState, form: FormData) {
  return forStudent(
    id,
    () =>
      api(`/students/${id}/change-branch`, {
        method: 'POST',
        body: {
          branchId: text(form, 'branchId'),
          classId: text(form, 'classId'),
          effectiveOn: text(form, 'effectiveOn'),
          reason: text(form, 'reason'),
          rollNo: text(form, 'rollNo'),
        },
      }),
    'Branch changed; the old branch keeps the history',
  );
}

export async function addGuardian(id: string, _previous: FormState, form: FormData) {
  return forStudent(
    id,
    () =>
      api(`/students/${id}/guardians`, {
        method: 'POST',
        body: {
          fullName: text(form, 'fullName'),
          relation: text(form, 'relation'),
          phone: text(form, 'phone'),
          email: text(form, 'email'),
          occupation: text(form, 'occupation'),
          isPrimary: form.get('isPrimary') === 'on' || undefined,
        },
      }),
    'Guardian added',
  );
}

export async function makePrimaryGuardian(id: string, guardianId: string) {
  return forStudent(
    id,
    () =>
      api(`/students/${id}/guardians/${guardianId}`, {
        method: 'PATCH',
        body: { isPrimary: true },
      }),
    'Primary guardian changed',
  );
}

export async function removeGuardian(id: string, guardianId: string) {
  return forStudent(
    id,
    () => api(`/students/${id}/guardians/${guardianId}`, { method: 'DELETE' }),
    'Guardian removed',
  );
}

export async function enrol(id: string, _previous: FormState, form: FormData) {
  return forStudent(
    id,
    () =>
      api(`/students/${id}/enrolments`, {
        method: 'POST',
        body: {
          academicYearId: text(form, 'academicYearId'),
          classId: text(form, 'classId'),
          rollNo: text(form, 'rollNo'),
        },
      }),
    'Placed in the section',
  );
}

export async function updateEnrolment(
  id: string,
  enrolmentId: string,
  _previous: FormState,
  form: FormData,
) {
  return forStudent(
    id,
    () =>
      api(`/students/${id}/enrolments/${enrolmentId}`, {
        method: 'PATCH',
        body: { rollNo: text(form, 'rollNo') ?? null },
      }),
    'Roll number saved',
  );
}

export async function deleteStudent(id: string): Promise<FormState> {
  try {
    await api(`/students/${id}`, { method: 'DELETE' });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  await flash('Student deleted');
  redirect('/students');
}

// --- Promotion -----------------------------------------------------------------------------------

/**
 * Applies a promotion. Each section row has a drop-down named "to_<fromSectionId>" whose value is
 * "section:<id>", "complete" or "skip".
 */
export async function applyPromotion(_previous: FormState, form: FormData): Promise<FormState> {
  const mapping = [...form.keys()]
    .filter((key) => key.startsWith('to_'))
    .map((key) => {
      const fromSectionId = key.slice(3);
      const [kind, id] = String(form.get(key)).split(':');
      if (kind === 'section') return { fromSectionId, toSectionId: id };
      if (kind === 'complete') return { fromSectionId, complete: true };
      return { fromSectionId };
    });
  let result: { promoted: number; completed: number };
  try {
    result = await api('/promotions', {
      method: 'POST',
      body: {
        branchId: text(form, 'branchId'),
        fromYearId: text(form, 'fromYearId'),
        toYearId: text(form, 'toYearId'),
        mapping,
        keepRollNumbers: form.get('keepRollNumbers') === 'on',
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/students/promote');
  return {
    success: `Promoted ${result.promoted}; ${result.completed} completed (now outgoing).`,
  };
}

// --- Import and admission numbers ---------------------------------------------------------------

/**
 * The columns of an import file (also the template's header). Where the students go (branch,
 * year, section) is chosen on the screen, not in the file (ADR-0030).
 */
const IMPORT_COLUMNS = [
  'admissionNo',
  'admissionDate',
  'fullName',
  'surname',
  'dateOfBirth',
  'gender',
  'phone',
  'email',
  'address',
  'previousInstitution',
  'previousMarks',
  'rollNo',
  'guardianName',
  'guardianRelation',
  'guardianPhone',
];

export async function importStudents(_previous: FormState, form: FormData): Promise<FormState> {
  const file = form.get('file');
  if (!text(form, 'classId')) return { error: 'Choose the section the students go into' };
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a CSV file' };
  if (file.size > 5_000_000) return { error: 'The file is too big (5 MB at most)' };
  const rows = parseCsv(await file.text(), IMPORT_COLUMNS);
  if (rows.length === 0) return { error: 'The file has no rows under its header' };
  if (rows.length > 2000) return { error: 'At most 2000 students per file; split the file' };
  const dryRun = form.get('dryRun') === 'on';

  let result: {
    ok: boolean;
    total: number;
    imported: number;
    errors: { row: number; message: string }[];
  };
  try {
    result = await api('/students/import', {
      method: 'POST',
      body: {
        academicYearId: text(form, 'academicYearId'),
        sectionId: text(form, 'classId'),
        dryRun,
        rows,
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  if (result.errors.length > 0) {
    const shown = result.errors
      .slice(0, 30)
      .map((e) => (e.row > 0 ? `Row ${e.row}: ${e.message}` : e.message))
      .join(' · ');
    const more = result.errors.length > 30 ? ` · and ${result.errors.length - 30} more` : '';
    return { error: `Nothing was saved. Fix these and try again: ${shown}${more}` };
  }
  if (dryRun) {
    return {
      success: `Checked ${result.total} row(s): no problems. Untick "Only check" to import.`,
    };
  }
  revalidatePath('/students');
  return { success: `Imported ${result.imported} student(s).` };
}

/** AUTOMATIC (with a pattern) or MANUAL admission numbers for the whole organization. */
export async function setNumbering(_previous: FormState, form: FormData): Promise<FormState> {
  let result: { mode: string; example: string | null };
  try {
    result = await api('/organization/admission-numbering', {
      method: 'PUT',
      body: { mode: text(form, 'mode'), pattern: text(form, 'pattern') ?? null },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/students/settings');
  return {
    success:
      result.mode === 'AUTOMATIC'
        ? `Saved. Numbers will look like ${result.example}.`
        : 'Saved: admission numbers are typed in the form and the import sheet.',
  };
}

export async function undoPromotion(runId: string): Promise<FormState> {
  let result: { undone: number };
  try {
    result = await api(`/promotions/${runId}/undo`, { method: 'POST' });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/students/promote');
  return { success: `Undone for ${result.undone} student(s).` };
}

// --- Portal logins (parent and student portal) ---------------------------------------------------

/** "for" is "STUDENT" or "GUARDIAN:<guardianId>". */
export async function grantPortalAccess(id: string, _previous: FormState, form: FormData) {
  const [who, guardianId] = String(form.get('for') ?? '').split(':');
  return forStudent(
    id,
    () =>
      api(`/students/${id}/portal-access`, {
        method: 'POST',
        body: {
          for: who,
          guardianId: guardianId || undefined,
          email: text(form, 'email'),
          password: text(form, 'password'),
        },
      }),
    'Login created. Give them the email and temporary password.',
  );
}

export async function revokePortalAccess(id: string, userId: string) {
  return forStudent(
    id,
    () => api(`/students/${id}/portal-access/${userId}`, { method: 'DELETE' }),
    'Portal access removed. That login no longer works.',
  );
}

// --- Documents -----------------------------------------------------------------------------------

/** Uploads the chosen file ("file") as the chosen type ("documentTypeId"). */
export async function uploadDocument(id: string, _previous: FormState, form: FormData) {
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a file' };
  if (file.size > 5 * 1024 * 1024) return { error: 'The file is bigger than 5 MB' };
  const body = new FormData();
  body.set('documentTypeId', String(form.get('documentTypeId') ?? ''));
  body.set('file', file, file.name);
  return forStudent(id, () => apiUpload(`/students/${id}/documents`, body), 'Document uploaded');
}

/** Verify (no note needed) or reject (with the reason in "note"). */
export async function reviewDocument(
  id: string,
  documentId: string,
  status: 'VERIFIED' | 'REJECTED',
  _previous: FormState,
  form: FormData,
) {
  return forStudent(
    id,
    () =>
      api(`/students/${id}/documents/${documentId}`, {
        method: 'PATCH',
        body: { status, note: text(form, 'note') },
      }),
    status === 'VERIFIED' ? 'Document verified' : 'Document rejected',
  );
}

export async function deleteDocument(id: string, documentId: string) {
  return forStudent(
    id,
    () => api(`/students/${id}/documents/${documentId}`, { method: 'DELETE' }),
    'Document deleted',
  );
}

// --- Document types (Student settings) -----------------------------------------------------------

export async function createDocumentType(_previous: FormState, form: FormData): Promise<FormState> {
  try {
    await api('/document-types', {
      method: 'POST',
      body: {
        name: text(form, 'name'),
        isRequired: form.get('isRequired') === 'on',
        visibleInPortal: form.get('visibleInPortal') === 'on',
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/students/settings');
  return { success: 'Document type added' };
}

export async function updateDocumentType(
  typeId: string,
  change: { isRequired?: boolean; visibleInPortal?: boolean; isActive?: boolean },
): Promise<FormState> {
  try {
    await api(`/document-types/${typeId}`, { method: 'PATCH', body: change });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/students/settings');
  return { success: 'Document type updated' };
}

export async function deleteDocumentType(typeId: string): Promise<FormState> {
  try {
    await api(`/document-types/${typeId}`, { method: 'DELETE' });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/students/settings');
  return { success: 'Document type deleted' };
}
