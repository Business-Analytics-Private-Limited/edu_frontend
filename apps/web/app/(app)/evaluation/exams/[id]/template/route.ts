/**
 * /evaluation/exams/:id/template?sectionId=: a CSV to fill in Excel and upload (backend ADR-0035).
 * Columns: admissionNo, name, section (name and section are only there to help, and ignored on
 * upload), then one column per subject code. One row per student of the exam that the user may
 * see (or of one section), with the marks already entered, so the file can also fix marks.
 */
import { api } from '../../../../../../lib/api';
import { csvLine } from '../../../../../../lib/csv';
import type { ExamResults, MarkCell } from '../../../../../../lib/types';

const shown = (cell: MarkCell | undefined) =>
  !cell
    ? ''
    : cell.status === 'ABSENT'
      ? 'AB'
      : cell.status === 'EXEMPT'
        ? 'EX'
        : (cell.marks ?? '');

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sectionId = new URL(request.url).searchParams.get('sectionId');
  const results = await api<ExamResults>(
    `/exams/${id}/results${sectionId ? `?sectionId=${encodeURIComponent(sectionId)}` : ''}`,
  );
  const students = [...results.students].sort(
    (a, b) =>
      a.section.label.localeCompare(b.section.label) ||
      (a.rollNo ?? '~').localeCompare(b.rollNo ?? '~', undefined, { numeric: true }) ||
      a.fullName.localeCompare(b.fullName),
  );
  const lines = [
    csvLine(['admissionNo', 'name', 'section', ...results.subjects.map((s) => s.code)]),
    ...students.map((s) =>
      csvLine([
        s.admissionNo,
        s.fullName,
        s.section.label,
        ...results.subjects.map((sub) => shown(s.marks[sub.subjectId])),
      ]),
    ),
  ];
  const fileName = `${results.exam.name.replace(/[^A-Za-z0-9-]+/g, '-').toLowerCase()}-marks.csv`;
  // A byte-order mark tells Excel the file is UTF-8.
  return new Response(`${String.fromCharCode(0xfeff)}${lines.join('\r\n')}\r\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
