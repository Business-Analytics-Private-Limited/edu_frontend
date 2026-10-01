'use server';
/**
 * Server actions for the Academic screens: academic years, class levels, classes, batches,
 * subjects and the calendar.
 * Each calls the API and returns a message for the form; the API checks every permission and
 * place again.
 */
import { revalidatePath } from 'next/cache';
import { api, errorMessage } from '../../../lib/api';
import type { FormState } from '../../../lib/types';

/** Runs an API call and refreshes the page; returns the API's error message if it fails. */
async function run(path: string, call: () => Promise<unknown>, success?: string) {
  try {
    await call();
  } catch (error) {
    return { error: errorMessage(error) } satisfies FormState;
  }
  revalidatePath(path);
  return (success ? { success } : {}) satisfies FormState;
}

// --- Academic years ------------------------------------------------------------------------------

export async function createYear(_previous: FormState, form: FormData): Promise<FormState> {
  return run(
    '/academic/years',
    () =>
      api('/academic-years', {
        method: 'POST',
        body: {
          institutionId: form.get('institutionId'),
          name: form.get('name'),
          startsOn: form.get('startsOn'),
          endsOn: form.get('endsOn'),
        },
      }),
    'Academic year added',
  );
}

export async function activateYear(id: string): Promise<FormState> {
  return run('/academic/years', () => api(`/academic-years/${id}/activate`, { method: 'POST' }));
}

export async function deleteYear(id: string): Promise<FormState> {
  return run('/academic/years', () => api(`/academic-years/${id}`, { method: 'DELETE' }));
}

// --- Class levels and classes ------------------------------------------------------------------

/** The levels textarea: one level per line, top to bottom. */
export async function setLevels(
  institutionId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const names = String(form.get('levels') ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
  return run(
    '/academic/levels',
    () => api(`/institutions/${institutionId}/class-levels`, { method: 'PUT', body: { names } }),
    'Levels saved',
  );
}

export async function createClass(
  campusId: string,
  parentId: string | null,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  return run('/academic/classes', () =>
    api(`/campuses/${campusId}/classes`, {
      method: 'POST',
      body: { parentId: parentId ?? undefined, name: form.get('name'), code: form.get('code') },
    }),
  );
}

export async function deleteClass(id: string): Promise<FormState> {
  return run('/academic/classes', () => api(`/classes/${id}`, { method: 'DELETE' }));
}

// --- Batches -------------------------------------------------------------------------------------

export async function createBatch(_previous: FormState, form: FormData): Promise<FormState> {
  return run(
    '/academic/batches',
    () =>
      api('/batches', {
        method: 'POST',
        body: {
          institutionId: form.get('institutionId'),
          name: form.get('name'),
          code: form.get('code'),
          stage: form.get('stage'),
        },
      }),
    'Batch added',
  );
}

export async function updateBatch(
  id: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  return run('/academic/batches', () =>
    api(`/batches/${id}`, {
      method: 'PATCH',
      body: { stage: form.get('stage'), status: form.get('status') },
    }),
  );
}

export async function deleteBatch(id: string): Promise<FormState> {
  return run('/academic/batches', () => api(`/batches/${id}`, { method: 'DELETE' }));
}

// --- Subjects ------------------------------------------------------------------------------------

export async function createSubject(_previous: FormState, form: FormData): Promise<FormState> {
  return run(
    '/academic/subjects',
    () =>
      api('/subjects', {
        method: 'POST',
        body: {
          institutionId: form.get('institutionId'),
          name: form.get('name'),
          code: form.get('code'),
        },
      }),
    'Subject added',
  );
}

export async function setSubjectInUse(id: string, isActive: boolean): Promise<FormState> {
  return run('/academic/subjects', () =>
    api(`/subjects/${id}`, { method: 'PATCH', body: { isActive } }),
  );
}

export async function deleteSubject(id: string): Promise<FormState> {
  return run('/academic/subjects', () => api(`/subjects/${id}`, { method: 'DELETE' }));
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
export async function setWeeklyOff(
  institutionId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  return run(
    '/academic/calendar',
    () =>
      api(`/institutions/${institutionId}/weekly-off`, {
        method: 'PUT',
        body: { days: form.getAll('days').map(Number) },
      }),
    'Saved',
  );
}

/** The "Where" value is "institution:<id>" (all campuses) or "campus:<institutionId>:<campusId>". */
export async function createHoliday(_previous: FormState, form: FormData): Promise<FormState> {
  const [kind, institutionId, campusId] = String(form.get('place') ?? '').split(':');
  const endsOn = String(form.get('endsOn') ?? '');
  return run(
    '/academic/calendar',
    () =>
      api('/holidays', {
        method: 'POST',
        body: {
          institutionId,
          campusId: kind === 'campus' ? campusId : undefined,
          name: form.get('name'),
          startsOn: form.get('startsOn'),
          endsOn: endsOn || undefined,
        },
      }),
    'Holiday added',
  );
}

export async function deleteHoliday(id: string): Promise<FormState> {
  return run('/academic/calendar', () => api(`/holidays/${id}`, { method: 'DELETE' }));
}
