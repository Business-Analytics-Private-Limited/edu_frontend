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
/**
 * A course (ADR-0033). "Specializations: No" sends its own number of years (B.Com: 1st ... 3rd
 * Year); "Yes" sends none, and specializations (CSE, ECE ...) are added next.
 */
export async function addCourse(_previous: FormState, form: FormData): Promise<FormState> {
  const withSpecializations = form.get('specializations') === 'yes';
  return run(
    STRUCTURE,
    () =>
      api('/academic-structure/courses', {
        method: 'POST',
        body: {
          name: text(form, 'name'),
          code: text(form, 'code').toUpperCase(),
          years: withSpecializations ? undefined : Number(form.get('years')),
        },
      }),
    withSpecializations
      ? 'Course added: now add its specializations'
      : 'Course added with its years',
  );
}

/** Edits a course or a specialization: name, code and (where it has its own) years. */
export async function updateProgramme(
  id: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const years = form.get('years');
  return run(
    STRUCTURE,
    () =>
      api(`/academic-structure/programmes/${id}`, {
        method: 'PATCH',
        body: {
          name: text(form, 'name'),
          code: text(form, 'code').toUpperCase(),
          ...(years !== null && { years: Number(years) }),
        },
      }),
    'Saved',
  );
}

/** Deletes a course or a specialization with its years (only while nothing has sections). */
export async function deleteProgramme(id: string): Promise<FormState> {
  return run(
    STRUCTURE,
    () => api(`/academic-structure/programmes/${id}`, { method: 'DELETE' }),
    'Deleted',
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

// --- Syllabus chapters (backend ADR-0037) -------------------------------------------------------

/** One chapter per line in the "names" box, added at the end of the syllabus. */
export async function addChapters(
  subjectId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const names = text(form, 'names')
    .split(/\r?\n/)
    .map((n) => n.trim())
    .filter(Boolean);
  if (names.length === 0) return { error: 'Write at least one chapter, one per line' };
  return run(
    `/academic/subjects/${subjectId}/chapters`,
    () => api(`/subjects/${subjectId}/chapters`, { method: 'POST', body: { names } }),
    names.length === 1 ? 'Chapter added' : `${names.length} chapters added`,
  );
}

export async function renameChapter(
  subjectId: string,
  chapterId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  return run(
    `/academic/subjects/${subjectId}/chapters`,
    () => api(`/chapters/${chapterId}`, { method: 'PATCH', body: { name: text(form, 'name') } }),
    'Chapter renamed',
  );
}

export async function setChapterInUse(
  subjectId: string,
  chapterId: string,
  isActive: boolean,
): Promise<FormState> {
  return run(
    `/academic/subjects/${subjectId}/chapters`,
    () => api(`/chapters/${chapterId}`, { method: 'PATCH', body: { isActive } }),
    isActive ? 'Chapter in use again' : 'Chapter no longer offered for new exams',
  );
}

export async function deleteChapter(subjectId: string, chapterId: string): Promise<FormState> {
  return run(
    `/academic/subjects/${subjectId}/chapters`,
    () => api(`/chapters/${chapterId}`, { method: 'DELETE' }),
    'Chapter deleted',
  );
}

/** Moves a chapter one place up or down: sends the whole new order. */
export async function moveChapter(
  subjectId: string,
  order: string[],
  index: number,
  by: -1 | 1,
): Promise<FormState> {
  const chapterIds = [...order];
  const [moved] = chapterIds.splice(index, 1);
  chapterIds.splice(index + by, 0, moved);
  return run(
    `/academic/subjects/${subjectId}/chapters`,
    () => api(`/subjects/${subjectId}/chapters/order`, { method: 'PUT', body: { chapterIds } }),
    'Order saved',
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
