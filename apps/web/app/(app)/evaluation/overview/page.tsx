/**
 * /evaluation/overview?academicYearId=: the year at a glance (backend ADR-0037): every exam of
 * the year with its students, pass % and average, over the students the user may see. Each row
 * opens that exam's own overview.
 */
import { EmptyState, Field, PageHeader, Select, Table, TableHead, Td, Th } from '@eduplatform/ui';
import { PieChart } from 'lucide-react';
import Link from 'next/link';
import { AutoSubmitForm } from '../../../../components/auto-submit-form';
import { api } from '../../../../lib/api';
import { can, getMe } from '../../../../lib/me';
import type { AcademicYear, YearOverviewRow } from '../../../../lib/types';
import { startingYearId } from '../../../../lib/years';

const pct = (value: number | null) => (value === null ? '—' : `${value}%`);

export default async function YearOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ academicYearId?: string }>;
}) {
  const params = await searchParams;
  const me = await getMe();
  const years = can(me, 'academic.year.view') ? await api<AcademicYear[]>('/academic-years') : [];
  const yearId = params.academicYearId ?? startingYearId(years) ?? years[0]?.id ?? '';
  const rows = yearId
    ? await api<YearOverviewRow[]>(`/exam-overview?academicYearId=${encodeURIComponent(yearId)}`)
    : [];

  return (
    <>
      <PageHeader
        title="Exam overview"
        description="Every exam of the year: pass % and average over the students you can see. Open an exam for its branches, groups, sections and subjects."
      />
      <AutoSubmitForm className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4 shadow-sm">
        <Field label="Academic year" htmlFor="academicYearId">
          <Select
            id="academicYearId"
            name="academicYearId"
            defaultValue={yearId}
            className="w-full sm:w-56"
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
                {y.status === 'ACTIVE' ? ' · current' : ''}
              </option>
            ))}
          </Select>
        </Field>
      </AutoSubmitForm>

      {rows.length === 0 ? (
        <EmptyState
          icon={<PieChart />}
          title="No exams in this year"
          description="Exams appear here once they are created."
        />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <Th>Exam</Th>
              <Th>Starts</Th>
              <Th className="text-right">Students</Th>
              <Th className="text-right">Passed</Th>
              <Th className="text-right">Failed</Th>
              <Th className="text-right">Pass %</Th>
              <Th className="text-right">Average</Th>
            </tr>
          </TableHead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td>
                  <Link
                    href={`/evaluation/exams/${r.id}/overview`}
                    className="font-medium text-primary hover:underline"
                  >
                    {r.name}
                  </Link>
                  <span className="block text-xs text-muted-foreground">
                    {r.examType.name} · {r.status === 'LOCKED' ? 'Locked' : 'Open for marks'}
                  </span>
                </Td>
                <Td className="whitespace-nowrap">{r.startsOn}</Td>
                <Td className="text-right tabular-nums">{r.students}</Td>
                <Td className="text-right tabular-nums">{r.passed}</Td>
                <Td className="text-right tabular-nums">{r.failed}</Td>
                <Td className="text-right tabular-nums">{pct(r.passPercentage)}</Td>
                <Td className="text-right tabular-nums">{pct(r.averagePercentage)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
