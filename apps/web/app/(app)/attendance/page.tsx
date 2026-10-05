/**
 * /attendance?campusId=&date= : a campus's day at a glance. Every section with its number of
 * students, whether attendance is marked, and the counts; "Mark" / "Open" goes to the register.
 * Defaults: your first campus, today (in the institution's time zone).
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
import type { DailySummary, Institution } from '../../../lib/types';
import { shiftDay, STATUSES } from './labels';
import { placeName } from '../../../lib/places';

export default async function AttendanceTodayPage({
  searchParams,
}: {
  searchParams: Promise<{ campusId?: string; date?: string }>;
}) {
  const params = await searchParams;
  const me = await getMe();
  const institutions = can(me, 'platform.institution.view')
    ? await api<Institution[]>('/institutions')
    : [];
  const campuses = institutions.flatMap((i) =>
    i.campuses
      .filter((c) => {
        const place = { institutionId: i.id, campusId: c.id };
        return (
          canAt(me, 'attendance.record.view', place) || canAt(me, 'attendance.record.mark', place)
        );
      })
      .map((c) => ({ ...c, institution: i })),
  );
  const campus = campuses.find((c) => c.id === params.campusId) ?? campuses[0];
  if (!campus) {
    return (
      <>
        <PageHeader title="Attendance" />
        <EmptyState
          icon={<ClipboardCheck />}
          title="No campus"
          description="Your roles don't include attendance at any campus."
        />
      </>
    );
  }

  // Without a date: ask the API for today's (it knows the institution's time zone).
  const first = await api<DailySummary>(
    `/attendance/daily-summary?${new URLSearchParams({ campusId: campus.id, date: params.date ?? new Date().toISOString().slice(0, 10) })}`,
  );
  const summary =
    params.date || first.date === first.today
      ? first
      : await api<DailySummary>(
          `/attendance/daily-summary?${new URLSearchParams({ campusId: campus.id, date: first.today })}`,
        );
  const link = (date: string) =>
    `/attendance?${new URLSearchParams({ campusId: campus.id, date })}`;
  const canMark = canAt(me, 'attendance.record.mark', {
    institutionId: campus.institution.id,
    campusId: campus.id,
  });

  return (
    <>
      <PageHeader
        title="Attendance"
        description={`${campus.name} · ${summary.date === summary.today ? 'today' : summary.date}${summary.academicYear ? ` · ${summary.academicYear.name}` : ''}`}
      />

      <form className="mb-4 flex flex-wrap items-end gap-3">
        {campuses.length > 1 && (
          <Field label="Campus" htmlFor="campusId">
            <Select id="campusId" name="campusId" defaultValue={campus.id} className="w-56">
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {placeName(c, c.institution)} ({c.institution.code})
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
                No sections with students on this campus
                {summary.academicYear ? '' : ' (no academic year covers this day)'}.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  );
}
