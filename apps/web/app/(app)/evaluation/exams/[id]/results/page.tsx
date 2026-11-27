/**
 * /evaluation/exams/:id/results?sectionId=: results of an exam (backend ADR-0035), for every
 * section the user may see or one section: each student's marks, total, percentage, PASS / FAIL
 * / INCOMPLETE, and ranks in the section and in the whole exam (1, 2, 2, 4 for ties). Exempt
 * subjects don't count; absent, or below the pass marks, in a subject is a FAIL.
 */
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  PageHeader,
  Select,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { AutoSubmitForm } from '../../../../../../components/auto-submit-form';
import { api } from '../../../../../../lib/api';
import type { ExamResults, MarkCell } from '../../../../../../lib/types';

function shown(cell: MarkCell | undefined): string {
  if (!cell) return '—';
  if (cell.status === 'ABSENT') return 'AB';
  if (cell.status === 'EXEMPT') return 'EX';
  return String(cell.marks);
}

const RESULT = {
  PASS: { label: 'Pass', variant: 'success' },
  FAIL: { label: 'Fail', variant: 'destructive' },
  INCOMPLETE: { label: 'Incomplete', variant: 'outline' },
} as const;

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sectionId?: string }>;
}) {
  const { id } = await params;
  const { sectionId } = await searchParams;
  const all = await api<ExamResults>(`/exams/${id}/results`);
  const results = sectionId
    ? await api<ExamResults>(`/exams/${id}/results?sectionId=${sectionId}`)
    : all;
  const s = results.summary;

  return (
    <>
      <PageHeader
        back={{ href: `/evaluation/exams/${id}`, label: 'Back to the exam' }}
        title={`${results.exam.name}: results`}
        description="Ranks are over everyone in the exam, so they are the same on every screen. Exempt subjects don't count."
      />
      <AutoSubmitForm className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Section" htmlFor="sectionId">
          <Select
            id="sectionId"
            name="sectionId"
            defaultValue={sectionId ?? ''}
            className="w-full sm:w-96"
          >
            <option value="">Every section you can see</option>
            {all.sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.label}
              </option>
            ))}
          </Select>
        </Field>
      </AutoSubmitForm>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Students', s.students],
          ['Passed', s.passed],
          ['Failed', s.failed],
          ['Incomplete', s.incomplete],
          ['Average', s.averagePercentage === null ? '—' : `${s.averagePercentage}%`],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold tabular-nums">{value}</CardContent>
          </Card>
        ))}
      </div>

      <Table>
        <TableHead>
          <tr>
            <Th className="text-right">Rank</Th>
            <Th>Student</Th>
            <Th>Section</Th>
            {results.subjects.map((sub) => (
              <Th key={sub.subjectId} className="text-right">
                {sub.code}
                <span className="block text-[11px] font-normal normal-case text-muted-foreground">
                  /{sub.maxMarks}
                </span>
              </Th>
            ))}
            <Th className="text-right">Total</Th>
            <Th className="text-right">%</Th>
            <Th>Result</Th>
            <Th className="text-right">Section rank</Th>
          </tr>
        </TableHead>
        <tbody>
          {results.students.length === 0 && (
            <tr>
              <Td
                colSpan={7 + results.subjects.length}
                className="py-8 text-center text-muted-foreground"
              >
                No students to show.
              </Td>
            </tr>
          )}
          {results.students.map((st) => (
            <tr key={st.studentId}>
              <Td className="text-right font-semibold tabular-nums">{st.examRank ?? '—'}</Td>
              <Td>
                <span className="font-medium">{st.fullName}</span>
                <span className="block font-mono text-xs text-muted-foreground">
                  {st.admissionNo}
                </span>
              </Td>
              <Td className="text-xs text-muted-foreground">{st.section.label}</Td>
              {results.subjects.map((sub) => {
                const cell = st.marks[sub.subjectId];
                const low =
                  cell?.status === 'ABSENT' ||
                  (cell?.status === 'PRESENT' && (cell.marks ?? 0) < sub.passMarks);
                return (
                  <Td
                    key={sub.subjectId}
                    className={`text-right tabular-nums ${low ? 'font-medium text-destructive' : ''}`}
                  >
                    {/* "n/a": not a subject of the student's section. */}
                    {st.subjectIds.includes(sub.subjectId) ? (
                      shown(cell)
                    ) : (
                      <span className="text-xs text-muted-foreground">n/a</span>
                    )}
                  </Td>
                );
              })}
              <Td className="text-right tabular-nums">
                {st.total}
                <span className="text-xs text-muted-foreground">/{st.maxTotal}</span>
              </Td>
              <Td className="text-right tabular-nums">{st.percentage ?? '—'}</Td>
              <Td>
                <Badge variant={RESULT[st.result].variant}>{RESULT[st.result].label}</Badge>
              </Td>
              <Td className="text-right tabular-nums">{st.sectionRank ?? '—'}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
