'use server';
/**
 * Evaluation actions (backend ADR-0035): exam types, exams, marks by hand and by CSV upload.
 * Each one calls the API and says what happened ({ success } or { error }).
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api, errorMessage } from '../../../lib/api';
import { readCsv } from '../../../lib/csv';
import { flash } from '../../../lib/flash';
import type { FormState, MarksUploadResult } from '../../../lib/types';

function text(form: FormData, name: string): string | undefined {
  const value = form.get(name);
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

// --- Exam types ----------------------------------------------------------------------------------

export async function createExamType(_previous: FormState, form: FormData): Promise<FormState> {
  try {
    await api('/exam-types', {
      method: 'POST',
      body: {
        name: text(form, 'name'),
        code: text(form, 'code'),
        description: text(form, 'description'),
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/evaluation/exam-types');
  return { success: 'Exam type added' };
}

export async function setExamTypeActive(id: string, isActive: boolean): Promise<FormState> {
  try {
    await api(`/exam-types/${id}`, { method: 'PATCH', body: { isActive } });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/evaluation/exam-types');
  return { success: isActive ? 'Switched on' : 'Switched off: no longer offered for new exams' };
}

export async function deleteExamType(id: string): Promise<FormState> {
  try {
    await api(`/exam-types/${id}`, { method: 'DELETE' });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/evaluation/exam-types');
  return { success: 'Exam type deleted' };
}

// --- Exams ---------------------------------------------------------------------------------------

/**
 * The New exam form. Subjects come as one row per subject: subject_<id> (ticked), max_<id>,
 * pass_<id>, date_<id>.
 */
export async function createExam(_previous: FormState, form: FormData): Promise<FormState> {
  const subjects = form
    .getAll('subject')
    .map(String)
    .map((id) => ({
      subjectId: id,
      maxMarks: Number(text(form, `max_${id}`)),
      passMarks: Number(text(form, `pass_${id}`)),
      examDate: text(form, `date_${id}`),
    }));
  if (subjects.length === 0) return { error: 'Tick at least one subject' };
  const bad = subjects.find((s) => !Number.isFinite(s.maxMarks) || !Number.isFinite(s.passMarks));
  if (bad) return { error: 'Give maximum and pass marks for every ticked subject' };

  let created: { id: string; name: string; sections: number };
  try {
    created = await api('/exams', {
      method: 'POST',
      body: {
        examTypeId: text(form, 'examTypeId'),
        academicYearId: text(form, 'academicYearId'),
        name: text(form, 'name'),
        classId: text(form, 'classId'),
        branchId: text(form, 'branchId'),
        startsOn: text(form, 'startsOn'),
        endsOn: text(form, 'endsOn'),
        subjects,
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/evaluation');
  await flash(`Exam created for ${created.sections} section(s)`);
  redirect(`/evaluation/exams/${created.id}`);
}

export async function setExamLocked(id: string, locked: boolean): Promise<FormState> {
  try {
    await api(`/exams/${id}/${locked ? 'lock' : 'unlock'}`, { method: 'POST' });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath(`/evaluation/exams/${id}`);
  revalidatePath('/evaluation');
  return {
    success: locked
      ? 'Locked: no more marks can be entered'
      : 'Unlocked: marks can be entered again',
  };
}

export async function deleteExam(id: string): Promise<FormState> {
  try {
    await api(`/exams/${id}`, { method: 'DELETE' });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath('/evaluation');
  await flash('Exam deleted');
  redirect('/evaluation');
}

// --- Marks ---------------------------------------------------------------------------------------

/**
 * A section's grid. Each cell is m_<studentId>_<subjectId> (a number, AB, EX or blank) and its
 * value when the page opened is o_<studentId>_<subjectId>: a cell emptied by the user is cleared.
 */
export async function saveMarks(
  examId: string,
  sectionId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const entries: { studentId: string; subjectId: string; status: string; marks?: number }[] = [];
  const problems: string[] = [];
  for (const [name, raw] of form.entries()) {
    if (!name.startsWith('m_') || typeof raw !== 'string') continue;
    const [, studentId, subjectId] = name.split('_');
    const value = raw.trim().toUpperCase();
    const before = String(form.get(`o_${studentId}_${subjectId}`) ?? '');
    if (value === before.toUpperCase()) continue; // unchanged
    if (value === '') entries.push({ studentId, subjectId, status: 'CLEAR' });
    else if (value === 'AB' || value === 'A')
      entries.push({ studentId, subjectId, status: 'ABSENT' });
    else if (value === 'EX') entries.push({ studentId, subjectId, status: 'EXEMPT' });
    else if (/^\d+(\.\d{1,2})?$/.test(value))
      entries.push({ studentId, subjectId, status: 'PRESENT', marks: Number(value) });
    else problems.push(`"${raw.trim()}" is not a mark`);
  }
  if (problems.length > 0)
    return { error: `${[...new Set(problems)].join('; ')} (use a number, AB or EX)` };
  if (entries.length === 0) return { success: 'Nothing changed' };
  let result: { saved: number; cleared: number };
  try {
    result = await api(`/exams/${examId}/marks`, { method: 'PUT', body: { sectionId, entries } });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath(`/evaluation/exams/${examId}`);
  return {
    success: `Saved ${result.saved} mark(s)${result.cleared ? `, cleared ${result.cleared}` : ''}`,
  };
}

/** "Row 3: reason; reason · Row 4: …" for the first rows left out. */
function describe(excluded: MarksUploadResult['excluded']): string {
  const shown = excluded
    .slice(0, 12)
    .map(
      (e) => `Row ${e.row}${e.admissionNo ? ` (${e.admissionNo})` : ''}: ${e.reasons.join('; ')}`,
    )
    .join(' · ');
  return excluded.length > 12 ? `${shown} · and ${excluded.length - 12} more` : shown;
}

/** "Check the file" (intent=check) or "Upload marks" (intent=upload). */
export async function uploadMarks(
  examId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a CSV file' };
  if (file.size > 5_000_000) return { error: 'The file is too big (5 MB at most)' };
  const rows = readCsv(await file.text());
  if (rows.length === 0) return { error: 'The file has no rows under its header' };
  if (rows.length > 5000) return { error: 'At most 5000 rows per file; split the file' };
  const dryRun = form.get('intent') !== 'upload';

  let result: MarksUploadResult;
  try {
    result = await api(`/exams/${examId}/marks/upload`, {
      method: 'POST',
      body: { dryRun, fileName: file.name, rows },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  const columns = `Subjects found: ${result.subjects.join(', ')}.${
    result.unknownColumns.length ? ` Ignored columns: ${result.unknownColumns.join(', ')}.` : ''
  }`;
  const left = result.excluded.length
    ? ` ${result.excluded.length} row(s) left out: ${describe(result.excluded)}`
    : '';
  if (dryRun) {
    if (result.readyRows === 0)
      return { error: `Checked ${result.totalRows} row(s): none can be saved. ${columns}${left}` };
    return {
      success: `Checked ${result.totalRows} row(s): ${result.readyRows} can be saved (${result.marksToSave} marks), nothing saved yet. ${columns} Click "Upload marks" to save them.${left}`,
    };
  }
  if (!result.upload) return { error: `Nothing was saved. ${left}` };
  revalidatePath(`/evaluation/exams/${examId}`);
  await flash(
    `${result.upload.code}: saved marks of ${result.readyRows} student(s)${result.excluded.length ? `, ${result.excluded.length} row(s) left out` : ''}`,
  );
  redirect(`/evaluation/uploads/${result.upload.id}`);
}
