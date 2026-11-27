/**
 * /evaluation/exams/:id/overview: how an exam went (backend ADR-0036), over the students the
 * user may see: pass % and averages for the whole exam, per branch, per group and per section;
 * each subject's average and pass %, the weakest subjects, the toppers and the grade spread.
 */
import {
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
import { api } from '../../../../../../lib/api';
import type { ExamOverview, OverviewSummary } from '../../../../../../lib/types';

const pct = (value: number | null) => (value === null ? '—' : `${value}%`);

export default async function ExamOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await api<ExamOverview>(`/exams/${id}/overview`);
  const e = o.everything;

  return (
    <>
      <PageHeader
        back={{ href: `/evaluation/exams/${id}`, label: 'Back to the exam' }}
        title={`${o.exam.name}: overview`}
        description="Over the students you can see. Pass % counts students with every mark in; averages are of percentages."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Students', String(e.students)],
          ['Pass %', pct(e.passPercentage)],
          ['Average', pct(e.averagePercentage)],
          ['Highest', pct(e.highestPercentage)],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold tabular-nums">{value}</CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Toppers</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {e.toppers.length === 0 && <p className="text-muted-foreground">No results yet.</p>}
            {e.toppers.map((t) => (
              <div
                key={t.studentId}
                className="flex justify-between gap-3 border-b pb-2 last:border-0"
              >
                <span>
                  <span className="mr-2 font-semibold tabular-nums">{t.examRank ?? '—'}.</span>
                  {t.fullName}
                  <span className="block font-mono text-xs text-muted-foreground">
                    {t.admissionNo}
                  </span>
                </span>
                <span className="tabular-nums">{pct(t.percentage)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Weak subjects</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {o.weakSubjects.length === 0 && <p className="text-muted-foreground">No marks yet.</p>}
            {o.weakSubjects.map((s) => (
              <div
                key={s.subjectId}
                className="flex justify-between gap-3 border-b pb-2 last:border-0"
              >
                <span>
                  {s.name} <span className="font-mono text-xs text-muted-foreground">{s.code}</span>
                </span>
                <span className="tabular-nums">
                  avg {pct(s.averagePercentage)} · pass {pct(s.passPercentage)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Grade spread</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {!o.gradeSpread && <p className="text-muted-foreground">This exam has no grades.</p>}
            {o.gradeSpread?.map((g) => {
              const width = e.students > 0 ? Math.round((g.students / e.students) * 100) : 0;
              return (
                <div key={g.grade} className="grid grid-cols-[3rem_1fr_2.5rem] items-center gap-2">
                  <span className="font-medium">{g.grade}</span>
                  <span className="h-2 rounded bg-muted">
                    <span className="block h-2 rounded bg-primary" style={{ width: `${width}%` }} />
                  </span>
                  <span className="text-right tabular-nums">{g.students}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Subjects</h2>
      <div className="mb-8">
        <Table>
          <TableHead>
            <tr>
              <Th>Subject</Th>
              <Th className="text-right">Students</Th>
              <Th className="text-right">Average</Th>
              <Th className="text-right">Pass %</Th>
              <Th className="text-right">Highest</Th>
            </tr>
          </TableHead>
          <tbody>
            {o.subjects.map((s) => (
              <tr key={s.subjectId}>
                <Td>
                  {s.name} <span className="font-mono text-xs text-muted-foreground">{s.code}</span>
                </Td>
                <Td className="text-right tabular-nums">{s.students}</Td>
                <Td className="text-right tabular-nums">{pct(s.averagePercentage)}</Td>
                <Td className="text-right tabular-nums">{pct(s.passPercentage)}</Td>
                <Td className="text-right tabular-nums">
                  {s.highest ?? '—'}
                  <span className="text-xs text-muted-foreground">/{s.maxMarks}</span>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {o.byBranch.length > 1 && <Breakdown title="By branch" rows={o.byBranch} />}
      {o.byGroup.length > 1 && <Breakdown title="By group" rows={o.byGroup} />}
      <Breakdown title="By section" rows={o.bySection} />
    </>
  );
}

/** One table of summaries: a row per branch, group or section. */
function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: (OverviewSummary & { id: string; label: string })[];
}) {
  return (
    <>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="mb-8">
        <Table>
          <TableHead>
            <tr>
              <Th>{title.replace('By ', '').replace(/^./, (c) => c.toUpperCase())}</Th>
              <Th className="text-right">Students</Th>
              <Th className="text-right">Passed</Th>
              <Th className="text-right">Failed</Th>
              <Th className="text-right">Pass %</Th>
              <Th className="text-right">Average</Th>
              <Th>Topper</Th>
            </tr>
          </TableHead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td>{r.label}</Td>
                <Td className="text-right tabular-nums">{r.students}</Td>
                <Td className="text-right tabular-nums">{r.passed}</Td>
                <Td className="text-right tabular-nums">{r.failed}</Td>
                <Td className="text-right tabular-nums">{pct(r.passPercentage)}</Td>
                <Td className="text-right tabular-nums">{pct(r.averagePercentage)}</Td>
                <Td className="text-sm">{r.toppers[0]?.fullName ?? '—'}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  );
}
