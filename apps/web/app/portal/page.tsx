/**
 * /portal: a parent's children (or a student's own card): school, branch, section, and
 * this month's attendance when the school uses the Attendance module.
 */
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
} from '@eduplatform/ui';
import { Users } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { getMe } from '../../lib/me';
import type { PortalAttendance, PortalMe } from '../../lib/types';

export default async function PortalHomePage() {
  // Portal switched off: the layout explains it; don't call the API (it would answer 403).
  if (!(await getMe()).enabledModules.includes('portal')) return null;
  const me = await api<PortalMe>('/portal/me');
  const to = new Date().toISOString().slice(0, 10);
  const from = `${to.slice(0, 8)}01`;
  const attendance = me.attendance
    ? await Promise.all(
        me.students.map((s) =>
          api<PortalAttendance>(
            `/portal/students/${s.id}/attendance?${new URLSearchParams({ from, to })}`,
          ),
        ),
      )
    : [];

  return (
    <>
      <PageHeader
        title={`Hello, ${me.name}`}
        description={me.kind === 'parent' ? 'Your children' : 'Your details'}
      />
      {me.students.length === 0 && (
        <EmptyState
          icon={<Users />}
          title="No students linked"
          description="Please contact the school."
        />
      )}
      <div className="grid gap-6 md:grid-cols-2">
        {me.students.map((s, i) => {
          const month = attendance[i];
          return (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle>
                  <Link href={`/portal/students/${s.id}`} className="hover:underline">
                    {s.fullName}
                    {s.surname ? ` ${s.surname}` : ''}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <p className="text-muted-foreground">
                  {s.admissionNo} · {s.organization.name}, {s.branch.name}
                </p>
                <p>
                  {s.placement
                    ? `${s.placement.section} · ${s.placement.academicYear}${s.placement.rollNo ? ` · Roll ${s.placement.rollNo}` : ''}`
                    : 'Not placed in a section yet'}
                </p>
                {month && (
                  <p>
                    Attendance this month:{' '}
                    {month.percentage === null ? (
                      <span className="text-muted-foreground">nothing marked yet</span>
                    ) : (
                      <Badge variant={month.percentage >= 75 ? 'success' : 'destructive'}>
                        {month.percentage}%
                      </Badge>
                    )}
                    {month.counts.ABSENT > 0 && (
                      <span className="ml-2 text-muted-foreground">
                        {month.counts.ABSENT} day(s) absent
                      </span>
                    )}
                  </p>
                )}
                <Link
                  href={`/portal/students/${s.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  See details
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
