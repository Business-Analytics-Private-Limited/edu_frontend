/**
 * /portal/students/:id : one child's (or the student's own) details and attendance of the last
 * 30 days: the percentage, the counts, and every day that wasn't "present" with the remark.
 * Only students linked to the login can be opened (the API answers 404 for any other).
 * With the Evaluation module, the results of LOCKED exams too (ADR-0036), each opening its page.
 */
import { Badge, Card, CardContent, CardHeader, CardTitle, PageHeader } from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { getMe } from '../../../../lib/me';
import type {
  PortalAttendance,
  PortalExamResult,
  PortalStudent,
  StudentDocument,
} from '../../../../lib/types';
import { STATUS_LABEL } from '../../../(app)/attendance/labels';
import { RELATIONS } from '../../../(app)/students/labels';

export default async function PortalStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await getMe()).enabledModules.includes('portal')) return null; // the layout explains
  const student = await api<PortalStudent>(`/portal/students/${id}`);
  const me = await api<{ attendance: boolean; results?: boolean }>('/portal/me');
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const attendance = me.attendance
    ? await api<PortalAttendance>(
        `/portal/students/${id}/attendance?${new URLSearchParams({ from, to })}`,
      )
    : null;
  const documents = await api<StudentDocument[]>(`/portal/students/${id}/documents`);
  const exams = me.results ? await api<PortalExamResult[]>(`/portal/students/${id}/exams`) : [];
  const current = student.placement;

  return (
    <>
      <PageHeader
        back={{ href: '/portal', label: 'Back' }}
        title={`${student.fullName}${student.surname ? ` ${student.surname}` : ''}`}
        description={`${student.admissionNo} · ${student.organization.name}, ${student.branch.name}`}
        actions={
          <Link href="/portal" className="text-sm text-primary hover:underline">
            Back
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 gap-y-2 break-words text-sm">
              <dt className="text-muted-foreground">Section</dt>
              <dd>{current?.section ?? '—'}</dd>
              <dt className="text-muted-foreground">Academic year</dt>
              <dd>{current?.academicYear ?? '—'}</dd>
              <dt className="text-muted-foreground">Roll no</dt>
              <dd>{current?.rollNo ?? '—'}</dd>
              <dt className="text-muted-foreground">Date of birth</dt>
              <dd>{new Date(student.dateOfBirth).toLocaleDateString()}</dd>
              {student.guardians?.map((g) => (
                <div key={g.guardian.fullName} className="contents">
                  <dt className="text-muted-foreground">{RELATIONS[g.relation]}</dt>
                  <dd>
                    {g.guardian.fullName}
                    {g.guardian.phone ? ` · ${g.guardian.phone}` : ''}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {attendance && (
          <Card>
            <CardHeader>
              <CardTitle>Attendance, last 30 days</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <p>
                {attendance.percentage === null ? (
                  <span className="text-muted-foreground">Nothing marked yet.</span>
                ) : (
                  <Badge variant={attendance.percentage >= 75 ? 'success' : 'destructive'}>
                    {attendance.percentage}%
                  </Badge>
                )}
                <span className="ml-2 text-muted-foreground">
                  Present {attendance.counts.PRESENT} · Absent {attendance.counts.ABSENT} · Late{' '}
                  {attendance.counts.LATE} · Half day {attendance.counts.HALF_DAY} · Leave{' '}
                  {attendance.counts.ON_LEAVE}
                </span>
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {attendance.days
                  .filter((d) => d.status !== 'PRESENT')
                  .map((d) => (
                    <li key={d.date}>
                      {new Date(`${d.date}T00:00:00Z`).toLocaleDateString()}:{' '}
                      <span className="font-medium">{STATUS_LABEL[d.status]}</span>
                      {d.remark ? (
                        <span className="text-muted-foreground"> · {d.remark}</span>
                      ) : null}
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {me.results && (
        <Card className="mt-6 max-w-xl">
          <CardHeader>
            <CardTitle>Exam results</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {exams.length === 0 && (
              <p className="text-muted-foreground">No results published yet.</p>
            )}
            {exams.map((e) => (
              <Link
                key={e.exam.id}
                href={`/portal/students/${id}/exams/${e.exam.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 hover:bg-muted/50"
              >
                <span>
                  <span className="font-medium">{e.exam.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {e.exam.examType} · {e.exam.startsOn}
                  </span>
                </span>
                <span className="flex items-center gap-2 tabular-nums">
                  {e.percentage === null ? '—' : `${e.percentage}%`}
                  {e.grade && <Badge variant="outline">{e.grade}</Badge>}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {documents.length > 0 && (
        <Card className="mt-6 max-w-xl">
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {documents.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{d.documentType.name}</span>
                {d.status === 'VERIFIED' && <Badge variant="success">Verified</Badge>}
                {d.status === 'REJECTED' && (
                  <Badge variant="destructive">Please give a new copy</Badge>
                )}
                <a
                  href={`/portal/students/${id}/documents/${d.id}`}
                  className="text-primary hover:underline"
                >
                  {d.file.originalName}
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
