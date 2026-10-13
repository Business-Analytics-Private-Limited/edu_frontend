/**
 * /attendance?branchId=&date= : a branch's day at a glance. Every section with its number of
 * students, whether attendance is marked, and the counts; "Mark" / "Open" goes to the register.
 * Defaults: your first branch, today (in the organization's time zone).
 */
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { can, canAt, getMe } from '../../../lib/me';
import type { Branch, DailySummary } from '../../../lib/types';
import { shiftDay, STATUSES } from './labels';
import { branchName } from '../../../lib/places';

export default async function AttendanceTodayPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string; date?: string }>;
}) {
  const params = await searchParams;
  const me = await getMe();
  const branches = (can(me, 'platform.branch.view') ? await api<Branch[]>('/branches') : []).filter(
    (b) =>
      canAt(me, 'attendance.record.view', { branchId: b.id }) ||
      canAt(me, 'attendance.record.mark', { branchId: b.id }),
  );
  const branch = branches.find((b) => b.id === params.branchId) ?? branches[0];
  if (!branch) {
    return (
      <>
        <PageHeader title="Attendance" />
        <EmptyState
          icon={<ClipboardCheck />}
          title="No branch"
          description="Your roles do not include attendance at any branch."
        />
      </>
    );
  }

  // Without a date: ask the API for today's (it knows the organization's time zone).
  const first = await api<DailySummary>(
    `/attendance/daily-summary?${new URLSearchParams({ branchId: branch.id, date: params.date ?? new Date().toISOString().slice(0, 10) })}`,
  );
  const summary =
    params.date || first.date === first.today
      ? first
      : await api<DailySummary>(
          `/attendance/daily-summary?${new URLSearchParams({ branchId: branch.id, date: first.today })}`,
        );
  const link = (date: string) =>
    `/attendance?${new URLSearchParams({ branchId: branch.id, date })}`;
  const canMark = canAt(me, 'attendance.record.mark', { branchId: branch.id });

  return (
    <>
      <PageHeader
        title="Attendance"
        description={`${branch.name} · ${summary.date === summary.today ? 'today' : summary.date}${summary.academicYear ? ` · ${summary.academicYear.name}` : ''}`}
      />

      <form className="mb-4 flex flex-wrap items-end gap-3">
        {branches.length > 1 && (
          <Field label="Branch" htmlFor="branchId">
            <Select
              id="branchId"
              name="branchId"
              defaultValue={branch.id}
              className="w-full sm:w-56"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {branchName(b)}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Date" htmlFor="date">
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={summary.date}
            max={summary.today}
          />
        </Field>
        <Button type="submit" variant="outline">
          Show
        </Button>
        <Link
          href={link(shiftDay(summary.date, -1))}
          className="text-sm text-primary hover:underline"
        >
          ← Previous day
        </Link>
        {summary.date < summary.today && (
          <Link
            href={link(shiftDay(summary.date, 1))}
            className="text-sm text-primary hover:underline"
          >
            Next day →
          </Link>
        )}
      </form>

      {!summary.workingDay && (
        <p className="mb-4 rounded-md border bg-muted px-4 py-3 text-sm">
          Not a working day: {summary.reason}
        </p>
      )}

      <Table>
        <TableHead>
          <tr>
            <Th>Section</Th>
            <Th>Students</Th>
            <Th>Marked</Th>
            {STATUSES.map((s) => (
              <Th key={s.value} title={s.label}>
                {s.short}
              </Th>
            ))}
            <Th />
          </tr>
        </TableHead>
        <tbody>
          {summary.sections.map((row) => (
            <tr key={row.section.id}>
              <Td className="font-medium">{row.section.name}</Td>
              <Td>{row.students}</Td>
              <Td>
                {row.marked ? (
                  <Badge variant="success">Marked</Badge>
                ) : (
                  <Badge variant={summary.workingDay ? 'warning' : 'outline'}>Not marked</Badge>
                )}
              </Td>
              {STATUSES.map((s) => (
                <Td key={s.value}>{row.marked ? row.counts[s.value] : '—'}</Td>
              ))}
              <Td className="text-right">
                <Link
                  href={`/attendance/mark?${new URLSearchParams({ classId: row.section.id, date: summary.date })}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {!row.marked && canMark && summary.workingDay ? 'Mark' : 'Open'}
                </Link>
              </Td>
            </tr>
          ))}
          {summary.sections.length === 0 && (
            <tr>
              <Td colSpan={9} className="py-8 text-center text-muted-foreground">
                No sections with students at this branch
                {summary.academicYear ? '' : ' (no academic year covers this day)'}.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  );
}
