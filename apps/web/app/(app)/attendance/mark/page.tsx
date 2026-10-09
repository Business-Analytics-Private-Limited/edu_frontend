/**
 * /attendance/mark?classId=&date= : a section's register for one day.
 *   - one row per student (roll number order) with Present / Absent / Late / Half day / On leave
 *     (Present is pre-selected when nothing is marked yet) and a remark;
 *   - on a past day that is already marked, saving changes needs a reason (a correction);
 *   - if the day can't be marked (future, holiday, weekly off, no academic year) it says why.
 * Read-only for people who may only view attendance.
 */
import { ActionForm, Badge, Field, Input, PageHeader } from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { canAt, getMe } from '../../../../lib/me';
import type { Roster } from '../../../../lib/types';
import { saveRegister } from '../actions';
import { shiftDay, STATUS_LABEL, STATUSES } from '../labels';

export default async function MarkAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; date?: string }>;
}) {
  const { classId = '', date = '' } = await searchParams;
  const me = await getMe();
  const roster = await api<Roster>(`/attendance/roster?${new URLSearchParams({ classId, date })}`);
  const place = { branchId: roster.section.branchId };
  const canMark = canAt(me, 'attendance.record.mark', place) && !roster.blocked;
  const isPast = roster.date < roster.today;
  const needsReason = isPast && roster.marked;
  const link = (d: string) => `/attendance/mark?${new URLSearchParams({ classId, date: d })}`;

  return (
    <>
      <PageHeader
        back={{
          href: `/attendance?${new URLSearchParams({ branchId: roster.section.branchId, date: roster.date })}`,
          label: 'Back to attendance',
        }}
        title={`Attendance · ${roster.section.label}`}
        description={`${roster.date === roster.today ? 'Today' : roster.date}${roster.academicYear ? ` · ${roster.academicYear.name}` : ''}${roster.lastMarkedBy ? ` · last saved by ${roster.lastMarkedBy.name}` : ''}`}
        actions={
          <div className="flex items-center gap-3 text-sm">
            <Link href={link(shiftDay(roster.date, -1))} className="text-primary hover:underline">
              ← Previous day
            </Link>
            {roster.date < roster.today && (
              <Link href={link(shiftDay(roster.date, 1))} className="text-primary hover:underline">
                Next day →
              </Link>
            )}
          </div>
        }
      />

      {roster.blocked && (
        <p className="mb-4 rounded-md border bg-muted px-4 py-3 text-sm">{roster.blocked}</p>
      )}

      {canMark ? (
        <ActionForm
          action={saveRegister.bind(null, classId, roster.date)}
          submitLabel={roster.marked ? 'Save changes' : 'Save attendance'}
          pendingLabel="Saving…"
          className="gap-4"
        >
          <Register roster={roster} editable />
          {needsReason && (
            <Field
              label="Reason for the change"
              htmlFor="reason"
              hint="Changing a past day is a correction: it is kept with your reason"
            >
              <Input id="reason" name="reason" placeholder="e.g. Leave letter received" />
            </Field>
          )}
        </ActionForm>
      ) : (
        <Register roster={roster} editable={false} />
      )}
    </>
  );
}

/** The table of students; radio buttons when editable, the saved status otherwise. */
function Register({ roster, editable }: { roster: Roster; editable: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Roll</th>
            <th className="px-3 py-2">Student</th>
            <th className="px-3 py-2">Attendance</th>
            <th className="px-3 py-2">Remark</th>
          </tr>
        </thead>
        <tbody>
          {roster.students.map((s) => (
            <tr key={s.studentId} className="border-t">
              <td className="px-3 py-2 text-muted-foreground">{s.rollNo ?? '—'}</td>
              <td className="px-3 py-2">
                <div className="font-medium">{s.fullName}</div>
                <div className="text-xs text-muted-foreground">{s.admissionNo}</div>
              </td>
              <td className="px-3 py-2">
                {editable ? (
                  <div className="flex flex-wrap gap-3">
                    {STATUSES.map((option) => (
                      <label key={option.value} className="inline-flex items-center gap-1">
                        <input
                          type="radio"
                          name={`status_${s.studentId}`}
                          value={option.value}
                          defaultChecked={(s.status ?? 'PRESENT') === option.value}
                          className="accent-[var(--primary)]"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                ) : s.status ? (
                  <span>
                    {STATUS_LABEL[s.status]}
                    {s.corrected && (
                      <Badge variant="outline" className="ml-2">
                        changed
                      </Badge>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Not marked</span>
                )}
              </td>
              <td className="px-3 py-2">
                {editable ? (
                  <Input
                    name={`remark_${s.studentId}`}
                    defaultValue={s.remark ?? ''}
                    className="w-48"
                    aria-label={`Remark for ${s.fullName}`}
                  />
                ) : (
                  (s.remark ?? '')
                )}
              </td>
            </tr>
          ))}
          {roster.students.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                No students in this section on this day.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
