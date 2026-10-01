'use server';
/**
 * Server actions for the Students screens: admission, profile, status, guardians, sections.
 * Each calls the API and returns a message for the form; the API checks every permission at
 * the student's campus again.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api, errorMessage } from '../../../lib/api';
import { parseCsv } from '../../../lib/csv';
import type { FormState, StudentProfile } from '../../../lib/types';

/** A text field, or undefined when left empty (so optional fields are left out). */
function text(form: FormData, name: string): string | undefined {
  const value = String(form.get(name) ?? '').trim();
  return value === '' ? undefined : value;
}

/** Runs an API call for one student's page and refreshes it. */
async function forStudent(id: string, call: () => Promise<unknown>, success?: string) {
  try {
    await call();
  } catch (error) {
    return { error: errorMessage(error) } satisfies FormState;
  }
  revalidatePath(`/students/${id}`);
  return (success ? { success } : {}) satisfies FormState;
}

export async function admitStudent(_previous: FormState, form: FormData): Promise<FormState> {
  const sectionId = text(form, 'sectionId');
  const academicYearId = text(form, 'academicYearId');
  const guardianName = text(form, 'guardianName');
  let student: StudentProfile;
  try {
    student = await api<StudentProfile>('/students', {
      method: 'POST',
      body: {
        campusId: text(form, 'campusId'),
        admissionNo: text(form, 'admissionNo'),
        admissionDate: text(form, 'admissionDate'),
        fullName: text(form, 'fullName'),
        surname: text(form, 'surname'),
        dateOfBirth: text(form, 'dateOfBirth'),
        gender: text(form, 'gender'),
        phone: text(form, 'phone'),
        email: text(form, 'email'),
        address: text(form, 'address'),
        batchId: text(form, 'batchId'),
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
          batchId: text(form, 'batchId'),
        },
      }),
    'Saved',
  );
}

export async function changeStatus(id: string, _previous: FormState, form: FormData) {
  return forStudent(
    id,
    () =>
      api(`/students/${id}/status`, {
        method: 'POST',
        body: {
          status: text(form, 'status'),
          effectiveOn: text(form, 'effectiveOn'),
          reason: text(form, 'reason'),
        },
      }),
    'Status changed',
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
  return forStudent(id, () =>
    api(`/students/${id}/guardians/${guardianId}`, { method: 'PATCH', body: { isPrimary: true } }),
  );
}

export async function removeGuardian(id: string, guardianId: string) {
  return forStudent(id, () => api(`/students/${id}/guardians/${guardianId}`, { method: 'DELETE' }));
}

export async function enrol(id: string, _previous: FormState, form: FormData) {
  return forStudent(
    id,
    () =>
      api(`/students/${id}/enrolments`, {
        method: 'POST',
        body: {
          academicYearId: text(form, 'academicYearId'),
          classId: text(form, 'sectionId'),
          rollNo: text(form, 'rollNo'),
        },
      }),
    'Placed in section',
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
        body: { classId: text(form, 'sectionId'), rollNo: text(form, 'rollNo') },
      }),
    'Saved',
  );
}

export async function deleteStudent(id: string): Promise<FormState> {
  try {
    await api(`/students/${id}`, { method: 'DELETE' });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  redirect('/students');
}

// --- Promotion and shuffle -----------------------------------------------------------------------

/**
 * Applies a promotion. Each section row has a drop-down named "to_<fromSectionId>" whose value is
 * "section:<id>", "graduate" or "skip".
 */
export async function applyPromotion(_previous: FormState, form: FormData): Promise<FormState> {
  const mapping = [...form.keys()]
    .filter((key) => key.startsWith('to_'))
    .map((key) => {
      const fromSectionId = key.slice(3);
      const [kind, id] = String(form.get(key)).split(':');
      if (kind === 'section') return { fromSectionId, toSectionId: id };
      if (kind === 'graduate') return { fromSectionId, graduate: true };
      return { fromSectionId };
    });
  let result: { promoted: number; graduated: number; batchesMoved: number };
  try {
    result = await api('/promotions', {
      method: 'POST',
      body: {
        campusId: text(form, 'campusId'),
        fromYearId: text(form, 'fromYearId'),
        toYearId: text(form, 'toYearId'),
        mapping,
        batchStage: text(form, 'batchStage'),
        keepRollNumbers: form.get('keepRollNumbers') === 'on',
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/students/promote');
  return {
    success: `Promoted ${result.promoted}, finished ${result.graduated}${
      result.batchesMoved ? `, ${result.batchesMoved} batch(es) moved to the new stage` : ''
    }.`,
  };
}

/** Shuffle: the ticked students (name="studentIds") to the chosen section. */
export async function moveStudents(_previous: FormState, form: FormData): Promise<FormState> {
  let result: { moved: number };
  try {
    result = await api('/enrolments/move', {
      method: 'POST',
      body: {
        academicYearId: text(form, 'academicYearId'),
        studentIds: form.getAll('studentIds'),
        toSectionId: text(form, 'toSectionId'),
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/students/move');
  return { success: `Moved ${result.moved} student(s). Roll numbers were cleared; set new ones.` };
}

// --- Campus transfer, import, numbering ----------------------------------------------------------

/** The "To" drop-down value is "<campusId>:<sectionId>" (or "<campusId>:" without a section). */
export async function transferCampus(id: string, _previous: FormState, form: FormData) {
  const [toCampusId, toSectionId] = String(form.get('to') ?? '').split(':');
  return forStudent(
    id,
    () =>
      api(`/students/${id}/transfer`, {
        method: 'POST',
        body: { toCampusId, toSectionId: toSectionId || undefined, reason: text(form, 'reason') },
      }),
    'Moved to the new campus',
  );
}

/** The columns of an import file (also the template's header). */
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
  'batch',
  'section',
  'rollNo',
  'guardianName',
  'guardianRelation',
  'guardianPhone',
];

export async function importStudents(_previous: FormState, form: FormData): Promise<FormState> {
  const file = form.get('file');
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
        campusId: text(form, 'campusId'),
        academicYearId: text(form, 'academicYearId'),
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

export async function setNumbering(
  institutionId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  let result: { pattern: string | null; example: string | null };
  try {
    result = await api(`/institutions/${institutionId}/admission-numbering`, {
      method: 'PUT',
      body: { pattern: text(form, 'pattern') ?? null },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/students/settings');
  return {
    success: result.example
      ? `Saved. The first number will look like ${result.example}.`
      : 'Saved: admission numbers are typed by hand.',
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
  return forStudent(id, () => api(`/students/${id}/portal-access/${userId}`, { method: 'DELETE' }));
}
