'use server';
/**
 * Server actions for the Students screens: admission, profile, status, guardians, sections.
 * Each calls the API and returns a message for the form; the API checks every permission at
 * the student's campus again.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api, errorMessage } from '../../../lib/api';
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
