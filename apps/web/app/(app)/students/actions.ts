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
import { IMPORT_COLUMNS } from '../../../lib/import-columns';
import type { ExcludedRow, FormState, ImportResult, StudentProfile } from '../../../lib/types';

/** A text field, or undefined when left empty (so optional fields are left out). */
function text(form: FormData, name: string): string | undefined {
  const value = String(form.get(name) ?? '').trim();
  return value === '' ? undefined : value;
}

/** The student's own details that are plain text (or a fixed value) in the form. */
const TEXT_DETAILS = [
  'surname',
  'bloodGroup',
  'phone',
  'alternatePhone',
  'email',
  'address',
  'permanentAddress',
  'area',
  'residence',
  'pickupPoint',
  'previousInstitution',
  'previousBoard',
  'hallTicketNo',
  'previousGrade',
  'admissionTestNo',
  'remarks',
  'learnerLevel',
];
/** Only in the form for users who may see them ("sensitiveShown" is then sent too). */
const SENSITIVE_DETAILS = ['aadhaar', 'category', 'subCaste', 'medicalCondition'];
const NUMBER_DETAILS = ['previousPercentage', 'admissionTestMarks'];

/**
 * The details from components/student-fields.tsx, as the API wants them. When editing
 * (`clearEmpty`), an emptied field is sent as null so the API clears it; when adding, empty
 * fields are left out. Sensitive fields are only sent when the form showed them.
 */
function studentDetails(form: FormData, clearEmpty: boolean) {
  const empty = clearEmpty ? null : undefined;
  const body: Record<string, unknown> = {
    fullName: text(form, 'fullName'),
    dateOfBirth: text(form, 'dateOfBirth'),
    gender: text(form, 'gender'),
    busFacility: form.get('busFacility') === 'on',
    topRanker: form.get('topRanker') === 'on',
  };
  const textFields = form.get('sensitiveShown')
    ? [...TEXT_DETAILS, ...SENSITIVE_DETAILS]
    : TEXT_DETAILS;
  for (const field of textFields) body[field] = text(form, field) ?? empty;
  for (const field of NUMBER_DETAILS) {
    const value = text(form, field);
    body[field] = value === undefined ? empty : Number(value);
  }
  if (!body.busFacility) body.pickupPoint = empty;
  return body;
}

/** Father, mother and guardian rows of the "Add student" form; the first one is the main contact. */
function parentsFrom(form: FormData) {
  const relations = { father: 'FATHER', mother: 'MOTHER', guardian: 'GUARDIAN' } as const;
  const parents = Object.entries(relations)
    .filter(([who]) => text(form, `${who}Name`))
    .map(([who, relation], index) => ({
      fullName: text(form, `${who}Name`),
      relation,
      phone: text(form, `${who}Phone`),
      occupation: text(form, `${who}Occupation`),
      isPrimary: index === 0,
    }));
  return parents.length ? parents : undefined;
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
  // A section without a year can't be saved: say so instead of adding the student unplaced.
  if (sectionId && !academicYearId) {
    return { error: 'Choose the academic year for the section (Placement step)' };
  }
  let student: StudentProfile;
  try {
    student = await api<StudentProfile>('/students', {
      method: 'POST',
      body: {
        branchId: text(form, 'branchId'),
        admissionNo: text(form, 'admissionNo'),
        admissionDate: text(form, 'admissionDate'),
        ...studentDetails(form, false),
        enrolment:
          sectionId && academicYearId
            ? { academicYearId, classId: sectionId, rollNo: text(form, 'rollNo') }
            : undefined,
        guardians: parentsFrom(form),
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  await flash('Student added');
  redirect(`/students/${student.id}`);
}

/** The "Edit student" page: saves every detail, then goes back to the student's page. */
export async function updateStudent(id: string, _previous: FormState, form: FormData) {
  try {
    await api(`/students/${id}`, {
      method: 'PATCH',
      body: { ...studentDetails(form, true), admissionNo: text(form, 'admissionNo') },
    });
  } catch (error) {
    return { error: errorMessage(error) } satisfies FormState;
  }
  revalidatePath(`/students/${id}`);
  revalidatePath('/students');
  await flash('Student details saved');
  redirect(`/students/${id}`);
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

/**
 * SHUFFLE (one student, from their page): another section of the same branch, or another
 * branch and a section there, from a day. The same branch is a section change; another branch
 * is a branch change (it needs the permission at both). The old placement ends the day before
 * and stays in the timeline.
 */
export async function shuffleStudent(
  id: string,
  currentBranchId: string,
  _previous: FormState,
  form: FormData,
) {
  const branchId = text(form, 'branchId') ?? currentBranchId;
  const sameBranch = branchId === currentBranchId;
  return forStudent(
    id,
    () =>
      api(`/students/${id}/${sameBranch ? 'change-section' : 'change-branch'}`, {
        method: 'POST',
        body: {
          ...(!sameBranch && { branchId }),
          classId: text(form, 'classId'),
          effectiveOn: text(form, 'effectiveOn'),
          reason: text(form, 'reason'),
          rollNo: text(form, 'rollNo'),
        },
      }),
    sameBranch
      ? 'Shuffled to the new section; the old one stays in the timeline'
      : 'Shuffled to the new branch; the old branch keeps the history',
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
 * "Add section" on the promotion board: a section in the next year (under `parentId`, e.g.
 * Senior › MPC › JEE Mains) at the branch, usually with the same code as the old one so it is
 * suggested by itself. The board then shows it as the target.
 */
export async function addNextYearSection(
  branchId: string,
  parentId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await api(`/branches/${branchId}/sections`, {
      method: 'POST',
      body: {
        parentId,
        name: text(form, 'name'),
        code: (text(form, 'code') ?? '').toUpperCase(),
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/students/promote');
  revalidatePath('/academic/sections');
  return { success: 'Section added: it is now the suggested target' };
}

/**
 * The promotion board: per section, where its students go (to_<sectionId>: "section:<id>" or
 * "complete") and which students are ticked (students_<sectionId>). Sections with nobody ticked
 * are left out; the others send exactly the ticked students (the rest stay where they are).
 */
export async function applyPromotion(_previous: FormState, form: FormData): Promise<FormState> {
  const mapping = [...form.keys()]
    .filter((key) => key.startsWith('to_'))
    .map((key) => {
      const fromSectionId = key.slice(3);
      const studentIds = form.getAll(`students_${fromSectionId}`).map(String);
      const [kind, id] = String(form.get(key)).split(':');
      if (kind === 'section') return { fromSectionId, toSectionId: id, studentIds };
      if (kind === 'complete') return { fromSectionId, complete: true, studentIds };
      return { fromSectionId, studentIds: [] };
    })
    .filter((choice) => choice.studentIds.length > 0);
  if (mapping.length === 0) return { error: 'Tick the students to promote first' };
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
    success:
      `Promoted ${result.promoted} student(s)` +
      (result.completed ? `; ${result.completed} completed (now outgoing)` : '') +
      '. If something is wrong, Undo is in Recent promotions.',
  };
}

// --- Import and admission numbers ---------------------------------------------------------------

/** "Row 3: reason; reason · Row 4: …" for the first excluded rows. */
function describeExcluded(excluded: ExcludedRow[]): string {
  const shown = excluded
    .slice(0, 15)
    .map((e) => `Row ${e.row}${e.fullName ? ` (${e.fullName})` : ''}: ${e.reasons.join('; ')}`)
    .join(' · ');
  return excluded.length > 15 ? `${shown} · and ${excluded.length - 15} more rows` : shown;
}

/**
 * The import page's two buttons (ADR-0031):
 *   "Check the file" (intent=check): nothing is saved; says how many rows can be imported and
 *     which will be excluded, and why;
 *   "Import students" (intent=import): the valid rows are saved, the invalid ones excluded; the
 *     import record (IMP-0001 …) opens, with the excluded rows and their reasons.
 */
export async function importStudents(_previous: FormState, form: FormData): Promise<FormState> {
  const file = form.get('file');
  if (!text(form, 'classId')) return { error: 'Choose the section the students go into' };
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a CSV file' };
  if (file.size > 5_000_000) return { error: 'The file is too big (5 MB at most)' };
  const rows = parseCsv(
    await file.text(),
    IMPORT_COLUMNS.map((c) => c.name),
  );
  if (rows.length === 0) return { error: 'The file has no rows under its header' };
  if (rows.length > 2000) return { error: 'At most 2000 students per file; split the file' };
  const dryRun = form.get('intent') !== 'import';

  let result: ImportResult;
  try {
    result = await api<ImportResult>('/students/import', {
      method: 'POST',
      body: {
        academicYearId: text(form, 'academicYearId'),
        sectionId: text(form, 'classId'),
        fileName: file.name,
        dryRun,
        rows,
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  const excluded = result.excludedCount
    ? ` ${result.excludedCount} row(s) will be excluded: ${describeExcluded(result.excluded)}`
    : '';
  if (dryRun) {
    if (result.importable === 0) {
      return { error: `Checked ${result.total} row(s): none can be imported.${excluded}` };
    }
    return {
      success: `Checked ${result.total} row(s): ${result.importable} can be imported, nothing saved yet. Click "Import students" to save them.${excluded}`,
    };
  }
  if (!result.run) {
    return {
      error: `Nothing was imported: every row has a problem. ${describeExcluded(result.excluded)}`,
    };
  }
  revalidatePath('/students');
  await flash(
    `${result.run.code}: imported ${result.imported} student(s)` +
      (result.excludedCount ? `, excluded ${result.excludedCount} (see below)` : ''),
  );
  redirect(`/students/imports/${result.run.id}`);
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
  revalidatePath('/students/import'); // the import page shows the switch and the columns
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
