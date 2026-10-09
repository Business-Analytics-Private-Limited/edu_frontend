'use server';
/**
 * Server actions for the Attendance screens.
 */
import { revalidatePath } from 'next/cache';
import { api, errorMessage } from '../../../lib/api';
import type { FormState } from '../../../lib/types';

/**
 * Saves a section's register. Each student row has radio buttons named "status_<studentId>"
 * and a remark field "remark_<studentId>". All rows are sent; the API keeps only real changes
 * (as new versions) and needs a reason for a past day.
 */
export async function saveRegister(
  classId: string,
  date: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const entries = [...form.keys()]
    .filter((key) => key.startsWith('status_'))
    .map((key) => {
      const studentId = key.slice('status_'.length);
      const remark = String(form.get(`remark_${studentId}`) ?? '').trim();
      return { studentId, status: String(form.get(key)), remark: remark || undefined };
    });
  const reason = String(form.get('reason') ?? '').trim();
  let result: { marked: number; changed: number };
  try {
    result = await api('/attendance/markings', {
      method: 'POST',
      body: { classId, date, entries, reason: reason || undefined },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/attendance');
  revalidatePath('/attendance/mark');
  if (result.marked === 0 && result.changed === 0) return { success: 'Nothing changed.' };
  return {
    success: `Saved: ${result.marked} marked${result.changed ? `, ${result.changed} changed` : ''}.`,
  };
}

export async function saveAttendanceSettings(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    await api('/organization/attendance-settings', {
      method: 'PUT',
      body: {
        timeZone: String(form.get('timeZone') ?? '').trim() || undefined,
        correctionDays: Number(form.get('correctionDays')),
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/attendance/settings');
  return { success: 'Saved' };
}
