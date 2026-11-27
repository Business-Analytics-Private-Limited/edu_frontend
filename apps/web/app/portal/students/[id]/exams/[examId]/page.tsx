/**
 * /portal/students/:id/exams/:examId: a parent's or student's view of one LOCKED exam (backend
 * ADR-0036): the marks and grade per subject, total, percentage, result, grade, GPA and rank in
 * the section, and the report card PDF.
 */
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { FileText } from 'lucide-react';
import { api } from '../../../../../../lib/api';
import { getMe } from '../../../../../../lib/me';
import type { PortalExamResult } from '../../../../../../lib/types';

const RESULT = {
  PASS: { label: 'Pass', variant: 'success' },
  FAIL: { label: 'Fail', variant: 'destructive' },
  INCOMPLETE: { label: 'Incomplete', variant: 'outline' },
} as const;

export default async function PortalExamPage({
  params,
}: {
  params: Promise<{ id: string; examId: string }>;
}) {
  const { id, examId } = await params;
  if (!(await getMe()).enabledModules.includes('portal')) return null; // the layout explains
  const r = await api<PortalExamResult>(`/portal/students/${id}/exams/${examId}`);

  return (
    <>
      <PageHeader
        back={{ href: `/portal/students/${id}`, label: 'Back' }}
        title={r.exam.name}
        description={`${r.exam.examType} · ${r.section} · ${
          r.exam.startsOn === r.exam.endsOn
            ? r.exam.startsOn
            : `${r.exam.startsOn} to ${r.exam.endsOn}`
        }`}
        actions={
          <Button asChild variant="outline">
            <a href={`/portal/students/${id}/exams/${examId}/report-card`}>
              <FileText /> Report card
            </a>
          </Button>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">
            {r.total}
            <span className="text-base text-muted-foreground">/{r.maxTotal}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Percentage</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">
            {r.percentage === null ? '—' : `${r.percentage}%`}
            {r.grade && <span className="ml-2 text-base">{r.grade}</span>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Result</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={RESULT[r.result].variant}>{RESULT[r.result].label}</Badge>
            {r.gpa !== null && <span className="ml-2 text-sm tabular-nums">GPA {r.gpa}</span>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rank in section
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">
            {r.sectionRank ?? '—'}
          </CardContent>
        </Card>
      </div>
      <Table>
        <TableHead>
          <tr>
            <Th>Subject</Th>
            <Th className="text-right">Marks</Th>
            <Th className="text-right">Pass</Th>
            <Th>Grade</Th>
          </tr>
        </TableHead>
        <tbody>
          {(r.subjects ?? []).map((s) => {
            const low =
              s.status === 'ABSENT' || (s.status === 'PRESENT' && (s.marks ?? 0) < s.passMarks);
            return (
              <tr key={s.code}>
                <Td>{s.name}</Td>
                <Td
                  className={`text-right tabular-nums ${low ? 'font-medium text-destructive' : ''}`}
                >
                  {s.status === 'ABSENT'
                    ? 'Absent'
                    : s.status === 'EXEMPT'
                      ? 'Exempt'
                      : s.marks === null
                        ? '—'
                        : s.marks}
                  <span className="text-xs text-muted-foreground">/{s.maxMarks}</span>
                </Td>
                <Td className="text-right tabular-nums">{s.passMarks}</Td>
                <Td>{s.grade ?? '—'}</Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
}
