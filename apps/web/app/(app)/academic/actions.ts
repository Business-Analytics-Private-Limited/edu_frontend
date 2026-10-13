'use server';
/**
 * Server actions for the Academic screens: academic years, the academic structure (school classes,
 * groups and streams, courses and specializations, level names, "next" year), each branch's
 * sections, subjects and the calendar (ADR-0030).
 * Each calls the API and returns a message for the form; the API checks every permission and
 * place again.
 */
import { revalidatePath } from 'next/cache';
import { api, errorMessage } from '../../../lib/api';
import type { FormState } from '../../../lib/types';

/** Runs an API call, refreshes the page and says what happened (or the API's error). */
async function run(path: string, call: () => Promise<unknown>, success: string) {
  try {
    await call();
  } catch (error) {
    return { error: errorMessage(error) } satisfies FormState;
  }
  revalidatePath(path);
  return { success } satisfies FormState;
}

const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim();

// --- Academic years ------------------------------------------------------------------------------

export async function createYear(_previous: FormState, form: FormData): Promise<FormState> {
  return run(
    '/academic/years',
    () =>
      api('/academic-years', {
        method: 'POST',
        body: {
          name: text(form, 'name'),
          startsOn: form.get('startsOn'),
          endsOn: form.get('endsOn'),
        },
      }),
    'Academic year added',
  );
}

export async function activateYear(id: string): Promise<FormState> {
  return run(
    '/academic/years',
    () => api(`/academic-years/${id}/activate`, { method: 'POST' }),
    'This is now the current academic year',
  );
}

export async function deleteYear(id: string): Promise<FormState> {
  return run(
    '/academic/years',
    () => api(`/academic-years/${id}`, { method: 'DELETE' }),
    'Academic year deleted',
  );
}

// --- The structure -------------------------------------------------------------------------------

const STRUCTURE = '/academic/structure';

/** The level-name inputs are named "level0", "level1", ... */
export async function setLevelNames(
  count: number,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const names = Array.from({ length: count }, (_, i) => text(form, `level${i}`));
  return run(
    STRUCTURE,
    () => api('/academic-structure/level-names', { method: 'PUT', body: { names } }),
    'Level names saved',
  );
}

/** School: the ticked classes (checkboxes named "codes"). */
export async function setSchoolClasses(_previous: FormState, form: FormData): Promise<FormState> {
  return run(
    STRUCTURE,
    () =>
      api('/academic-structure/school-classes', {
        method: 'PUT',
        body: { codes: form.getAll('codes') },
      }),
    'Classes saved',
  );
}

/** Intermediate: the groups switched on (checkboxes named "codes"). */
export async function setGroups(_previous: FormState, form: FormData): Promise<FormState> {
  return run(
    STRUCTURE,
    () =>
      api('/academic-structure/groups', { method: 'PUT', body: { codes: form.getAll('codes') } }),
    'Groups saved',
  );
}

/**
 * "Groups at each branch" (ADR-0032): one checkbox per branch and group, named "g-<branchId>";
 * "branch" lists the branches the user may change, "was-<branchId>" what they ran before.
 * Only changed branches are saved; each one's problem is reported with its name.
 */
export async function setBranchGroups(_previous: FormState, form: FormData): Promise<FormState> {
  const errors: string[] = [];
  let saved = 0;
  for (const id of form.getAll('branch').map(String)) {
    const codes = form.getAll(`g-${id}`).map(String).sort();
    if (codes.join(',') === text(form, `was-${id}`)) continue;
    try {
      await api(`/branches/${id}/groups`, { method: 'PUT', body: { codes } });
      saved++;
    } catch (error) {
      errors.push(`${text(form, `name-${id}`)}: ${errorMessage(error)}`);
    }
  }
  revalidatePath(STRUCTURE);
  revalidatePath('/academic/sections');
  if (errors.length > 0) {
    return { error: `${saved ? `Saved ${saved} branch(es). ` : ''}${errors.join(' · ')}` };
  }
  return { success: saved ? `Saved the groups of ${saved} branch(es)` : 'Nothing changed' };
}

export async function addStream(_previous: FormState, form: FormData): Promise<FormState> {
  return run(
    STRUCTURE,
    () =>
      api('/academic-structure/streams', {
        method: 'POST',
        body: {
          groupCode: form.get('groupCode'),
          name: text(form, 'name'),
          code: text(form, 'code').toUpperCase(),
          longTerm: form.get('longTerm') === 'on',
        },
      }),
    'Stream added',
  );
}

export async function deleteStream(groupCode: string, code: string): Promise<FormState> {
  return run(
    STRUCTURE,
    () => api(`/academic-structure/streams/${groupCode}/${code}`, { method: 'DELETE' }),
    'Stream deleted',
  );
}

/** Degree / Engineering. */
export async function addCourse(_previous: FormState, form: FormData): Promise<FormState> {
  return run(
    STRUCTURE,
    () =>
      api('/academic-structure/courses', {
        method: 'POST',
        body: { name: text(form, 'name'), code: text(form, 'code').toUpperCase() },
      }),
    'Course added',
  );
}

export async function addSpecialization(
  courseId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  return run(
    STRUCTURE,
    () =>
      api(`/academic-structure/courses/${courseId}/specializations`, {
        method: 'POST',
        body: {
          name: text(form, 'name'),
          code: text(form, 'code').toUpperCase(),
          years: Number(form.get('years')),
        },
      }),
    'Specialization added with its years',
  );
}

/** Rename a class (any level). */
export async function renameClass(
  id: string,
  path: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  return run(
    path,
    () => api(`/classes/${id}`, { method: 'PATCH', body: { name: text(form, 'name') } }),
    'Renamed',
  );
}

/** A year's "next": the select is named "nextClassId" ("" = students complete). */
export async function setNext(
  id: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const next = text(form, 'nextClassId');
  return run(
    STRUCTURE,
    () => api(`/classes/${id}`, { method: 'PATCH', body: { nextClassId: next || null } }),
    next
      ? 'Saved: students move on to the chosen year'
      : 'Saved: students complete after this year',
  );
}

export async function setClassInUse(
  id: string,
  path: string,
  isActive: boolean,
): Promise<FormState> {
  return run(
    path,
    () => api(`/classes/${id}`, { method: 'PATCH', body: { isActive } }),
    isActive ? 'In use again' : 'No longer in use (kept for history)',
  );
}

export async function deleteClass(id: string, path: string): Promise<FormState> {
  return run(path, () => api(`/classes/${id}`, { method: 'DELETE' }), 'Deleted');
}

// --- Sections of a branch ------------------------------------------------------------------------

export async function createSection(
  branchId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  return run(
    '/academic/sections',
    () =>
      api(`/branches/${branchId}/sections`, {
        method: 'POST',
        body: {
          parentId: form.get('parentId'),
          name: text(form, 'name'),
          code: text(form, 'code').toUpperCase(),
        },
      }),
    'Section added',
  );
}

// --- Subjects ------------------------------------------------------------------------------------

export async function createSubject(_previous: FormState, form: FormData): Promise<FormState> {
  return run(
    '/academic/subjects',
    () =>
      api('/subjects', {
        method: 'POST',
        body: { name: text(form, 'name'), code: text(form, 'code').toUpperCase() },
      }),
    'Subject added',
  );
}

export async function setSubjectInUse(id: string, isActive: boolean): Promise<FormState> {
  return run(
    '/academic/subjects',
    () => api(`/subjects/${id}`, { method: 'PATCH', body: { isActive } }),
    isActive ? 'Subject in use again' : 'Subject no longer in use',
  );
}

export async function deleteSubject(id: string): Promise<FormState> {
  return run(
    '/academic/subjects',
    () => api(`/subjects/${id}`, { method: 'DELETE' }),
    'Subject deleted',
  );
}

/** The ticked subject checkboxes all have name="subjectIds". */
export async function setClassSubjects(
  classId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  return run(
    `/academic/classes/${classId}/subjects`,
    () =>
      api(`/classes/${classId}/subjects`, {
        method: 'PUT',
        body: { subjectIds: form.getAll('subjectIds') },
      }),
    'Subjects saved',
  );
}

// --- Calendar ------------------------------------------------------------------------------------

/** The ticked weekday checkboxes all have name="days" (0 = Sunday ... 6 = Saturday). */
export async function setWeeklyOff(_previous: FormState, form: FormData): Promise<FormState> {
  return run(
    '/academic/calendar',
    () =>
      api('/calendar/weekly-off', {
        method: 'PUT',
        body: { days: form.getAll('days').map(Number) },
      }),
    'Weekly off days saved',
  );
}

/** "Where": "" = every branch, or one branch's id. */
export async function createHoliday(_previous: FormState, form: FormData): Promise<FormState> {
  const branchId = text(form, 'branchId');
  const endsOn = text(form, 'endsOn');
  return run(
    '/academic/calendar',
    () =>
      api('/holidays', {
        method: 'POST',
        body: {
          branchId: branchId || undefined,
          name: text(form, 'name'),
          startsOn: form.get('startsOn'),
          endsOn: endsOn || undefined,
        },
      }),
    'Holiday added',
  );
}

export async function deleteHoliday(id: string): Promise<FormState> {
  return run(
    '/academic/calendar',
    () => api(`/holidays/${id}`, { method: 'DELETE' }),
    'Holiday deleted',
  );
}
