/**
 * /attendance/report?classId=&from=&to= : a section's attendance over a date range: each
 * student's present / absent / late / half day / leave and percentage, and how many working days
 * were (not) marked. Percentage: present and late count fully, a half day half, leave doesn't
 * count against the student. Needs "attendance.report.view" at the section's branch.
 */
import {
  Badge,
  Button,
  Field,
  Input,
  PageHeader,
  Select,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import { branchesWith, can, getMe } from '../../../../lib/me';
import { pickerData } from '../../../../lib/structure';
import type { Branch, SectionReport } from '../../../../lib/types';
import { STATUSES } from '../labels';

export default async function AttendanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const me = await getMe();
  const reach = branchesWith(me, 'attendance.report.view');
  const branches = (can(me, 'platform.branch.view') ? await api<Branch[]>('/branches') : []).filter(
    (b) => reach === 'all' || reach.includes(b.id),
  );
  // Every section of those branches, as "KPHB · Junior › MPC › JEE Mains › JEE-A".
  const sections = can(me, 'academic.structure.view')
    ? (await pickerData(branches.map((b) => b.id))).sections
    : [];
  const branchName = new Map(branches.map((b) => [b.id, b.name]));

  const today = new Date().toISOString().slice(0, 10);
  const from = params.from ?? `${today.slice(0, 8)}01`;
  const to = params.to ?? today;
  const report = params.classId
    ? await api<SectionReport>(
        `/attendance/section-report?${new URLSearchParams({ classId: params.classId, from, to })}`,
      )
    : null;

  return (
    <>
      <PageHeader
        back={{ href: '/attendance', label: 'Back to attendance' }}
        title="Attendance report"
        description="A section's attendance over a period."
      />
      <form className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Section" htmlFor="classId">
          <Select
            id="classId"
            name="classId"
            defaultValue={params.classId}
            required
            className="w-full sm:w-80"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {branchName.get(s.branchId!)} · {s.path} › {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="From" htmlFor="from">
          <Input id="from" name="from" type="date" defaultValue={from} required />
        </Field>
        <Field label="To" htmlFor="to">
          <Input id="to" name="to" type="date" defaultValue={to} required />
        </Field>
        <Button type="submit" variant="outline">
          Show
        </Button>
      </form>

      {report && (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {report.workingDays} working day(s) · {report.markedDays} marked
            {report.unmarkedDays > 0 && (
              <Badge variant="warning" className="ml-2">
                {report.unmarkedDays} not marked
              </Badge>
            )}
          </p>
          <Table>
            <TableHead>
              <tr>
                <Th>Roll</Th>
                <Th>Student</Th>
                {STATUSES.map((s) => (
                  <Th key={s.value} title={s.label}>
                    {s.short}
                  </Th>
                ))}
                <Th>%</Th>
              </tr>
            </TableHead>
            <tbody>
              {report.students.map((s) => (
                <tr key={s.studentId}>
                  <Td className="text-muted-foreground">{s.rollNo ?? '—'}</Td>
                  <Td>
                    <span className="font-medium">{s.fullName}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{s.admissionNo}</span>
                  </Td>
                  {STATUSES.map((st) => (
                    <Td key={st.value}>{s.counts[st.value]}</Td>
                  ))}
                  <Td>
                    {s.percentage === null ? (
                      '—'
                    ) : (
                      <Badge variant={s.percentage >= 75 ? 'success' : 'destructive'}>
                        {s.percentage}%
                      </Badge>
                    )}
                  </Td>
                </tr>
              ))}
              {report.students.length === 0 && (
                <tr>
                  <Td colSpan={8} className="py-8 text-center text-muted-foreground">
                    No attendance marked in this period.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
          <p className="mt-2 text-xs text-muted-foreground">
            P present · A absent · L late · H half day · Lv on leave. Below 75% is shown in red.
          </p>
        </>
      )}
    </>
  );
}
