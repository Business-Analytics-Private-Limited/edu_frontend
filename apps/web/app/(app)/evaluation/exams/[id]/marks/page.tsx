/**
 * /evaluation/exams/:id/marks?sectionId=: one section's marks (backend ADR-0035): its students in
 * roll number order, one box per subject. Type a number, AB (absent) or EX (exempt); empty a box
 * to remove a mark. "Save marks" sends only what changed, all or nothing. Read-only when the exam
 * is locked or the user may not enter marks at the section's branch.
 */
import { ActionForm, Input, PageHeader, Table, TableHead, Td, Th } from '@eduplatform/ui';
import { api } from '../../../../../../lib/api';
import type { MarkCell, MarksGrid } from '../../../../../../lib/types';
import { saveMarks } from '../../../actions';

/** A stored mark as typed in a box: 78, AB, EX, or empty. */
function shown(cell: MarkCell | undefined): string {
  if (!cell) return '';
  if (cell.status === 'ABSENT') return 'AB';
  if (cell.status === 'EXEMPT') return 'EX';
  return String(cell.marks ?? '');
}

export default async function MarksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sectionId?: string }>;
}) {
  const { id } = await params;
  const { sectionId = '' } = await searchParams;
  const grid = await api<MarksGrid>(`/exams/${id}/marks?sectionId=${sectionId}`);
  const editable = grid.canEnter;

  const table = (
    <Table>
      <TableHead>
        <tr>
          <Th>Roll</Th>
          <Th>Student</Th>
          {grid.subjects.map((s) => (
            <Th key={s.subjectId} className="text-center">
              {s.code}
              <span className="block text-[11px] font-normal normal-case text-muted-foreground">
                max {s.maxMarks}, pass {s.passMarks}
              </span>
            </Th>
          ))}
        </tr>
      </TableHead>
      <tbody>
        {grid.students.length === 0 && (
          <tr>
            <Td
              colSpan={2 + grid.subjects.length}
              className="py-8 text-center text-muted-foreground"
            >
              No students were placed in this section during the exam.
            </Td>
          </tr>
        )}
        {grid.students.map((st) => (
          <tr key={st.studentId}>
            <Td className="text-muted-foreground">{st.rollNo ?? '—'}</Td>
            <Td>
              <span className="font-medium">{st.fullName}</span>
              <span className="block font-mono text-xs text-muted-foreground">
                {st.admissionNo}
              </span>
            </Td>
            {grid.subjects.map((s) => {
              const value = shown(st.marks[s.subjectId]);
              const failed =
                st.marks[s.subjectId]?.status === 'ABSENT' ||
                (st.marks[s.subjectId]?.status === 'PRESENT' &&
                  (st.marks[s.subjectId]?.marks ?? 0) < s.passMarks);
              return (
                <Td key={s.subjectId} className="text-center">
                  {editable ? (
                    <>
                      <input
                        type="hidden"
                        name={`o_${st.studentId}_${s.subjectId}`}
                        value={value}
                      />
                      <Input
                        name={`m_${st.studentId}_${s.subjectId}`}
                        defaultValue={value}
                        inputMode="decimal"
                        pattern="(\d+(\.\d{1,2})?|[Aa][Bb]?|[Ee][Xx])"
                        title={`A number up to ${s.maxMarks}, AB (absent) or EX (exempt)`}
                        aria-label={`${st.fullName}, ${s.name}`}
                        className="mx-auto w-20 text-center tabular-nums"
                        autoComplete="off"
                      />
                    </>
                  ) : (
                    <span className={failed ? 'font-medium text-destructive' : 'tabular-nums'}>
                      {value || '—'}
                    </span>
                  )}
                </Td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </Table>
  );

  return (
    <>
      <PageHeader
        back={{ href: `/evaluation/exams/${id}`, label: 'Back to the exam' }}
        title={`${grid.exam.name}: marks`}
        description={`${grid.section.label}. ${
          editable
            ? 'Type a number, AB for absent or EX for exempt; empty a box to remove a mark.'
            : grid.exam.status === 'LOCKED'
              ? 'The exam is locked: marks can only be read.'
              : 'You may read these marks.'
        }`}
      />
      {editable && grid.students.length > 0 ? (
        <ActionForm
          action={saveMarks.bind(null, id, sectionId)}
          submitLabel="Save marks"
          pendingLabel="Saving…"
        >
          {table}
        </ActionForm>
      ) : (
        table
      )}
    </>
  );
}
