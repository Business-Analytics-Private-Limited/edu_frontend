/**
 * /evaluation: the exams (backend ADR-0035). Filter by academic year and exam type. Each exam is
 * for a part of the structure (a year, group, stream or section) at one branch or every branch.
 * "New exam" needs "evaluation.exam.create"; exam types are kept on /evaluation/exam-types.
 */
import {
  Badge,
  Button,
  EmptyState,
  Field,
  PageHeader,
  Select,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { FileSpreadsheet, Plus } from 'lucide-react';
import Link from 'next/link';
import { AutoSubmitForm } from '../../../components/auto-submit-form';
import { api } from '../../../lib/api';
import { can, getMe } from '../../../lib/me';
import type { AcademicYear, ExamListItem, ExamType } from '../../../lib/types';
import { startingYearId } from '../../../lib/years';

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ academicYearId?: string; examTypeId?: string }>;
}) {
  const params = await searchParams;
  const me = await getMe();
  const [years, types] = await Promise.all([
    can(me, 'academic.year.view') ? api<AcademicYear[]>('/academic-years') : [],
    api<ExamType[]>('/exam-types'),
  ]);
  const yearId = params.academicYearId ?? startingYearId(years) ?? '';
  const query = new URLSearchParams();
  if (yearId) query.set('academicYearId', yearId);
  if (params.examTypeId) query.set('examTypeId', params.examTypeId);
  const exams = await api<ExamListItem[]>(`/exams?${query}`);

  return (
    <>
      <PageHeader
        title="Exams"
        description="Each exam is for a part of the structure (a year, group, stream or one section), at one branch or at every branch."
        actions={
          can(me, 'evaluation.exam.create') && (
            <Button asChild>
              <Link href="/evaluation/new">
                <Plus /> New exam
              </Link>
            </Button>
          )
        }
      />
      <AutoSubmitForm className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4 shadow-sm">
        <Field label="Academic year" htmlFor="academicYearId">
          <Select
            id="academicYearId"
            name="academicYearId"
            defaultValue={yearId}
            className="w-full sm:w-44"
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
                {y.status === 'ACTIVE' ? ' · current' : ''}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Exam type" htmlFor="examTypeId">
          <Select
            id="examTypeId"
            name="examTypeId"
            defaultValue={params.examTypeId ?? ''}
            className="w-full sm:w-48"
          >
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" variant="outline">
          Show
        </Button>
      </AutoSubmitForm>

      {exams.length === 0 ? (
        <EmptyState
          icon={<FileSpreadsheet />}
          title="No exams yet"
          description={
            types.length === 0
              ? 'Add exam types first (Evaluation → Exam types), then create an exam.'
              : 'Create an exam: choose its type, the part of the structure it is for, and its subjects with marks.'
          }
        />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <Th>Exam</Th>
              <Th>For</Th>
              <Th>Dates</Th>
              <Th className="text-right">Subjects</Th>
              <Th className="text-right">Marks in</Th>
              <Th>Status</Th>
            </tr>
          </TableHead>
          <tbody>
            {exams.map((e) => (
              <tr key={e.id}>
                <Td>
                  <Link
                    href={`/evaluation/exams/${e.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {e.name}
                  </Link>
                  <span className="block text-xs text-muted-foreground">
                    {e.examType.name} · {e.academicYear.name}
                  </span>
                </Td>
                <Td>
                  {e.appliesTo.label}
                  <span className="block text-xs text-muted-foreground">
                    {e.branch?.name ?? 'Every branch'}
                  </span>
                </Td>
                <Td className="whitespace-nowrap">
                  {e.startsOn === e.endsOn ? e.startsOn : `${e.startsOn} to ${e.endsOn}`}
                </Td>
                <Td className="text-right">{e.subjectCount}</Td>
                <Td className="text-right">{e.marksEntered}</Td>
                <Td>
                  <Badge variant={e.status === 'OPEN' ? 'success' : 'outline'}>
                    {e.status === 'OPEN' ? 'Open' : 'Locked'}
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
