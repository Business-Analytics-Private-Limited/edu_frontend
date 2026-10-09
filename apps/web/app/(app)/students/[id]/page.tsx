/**
 * /students/:id: one student (ADR-0030). Everything here is for ONE student at a time:
 *   - Profile (edit with "students.student.update" at the student's branch), incl. lateral entry
 *   - Parents / guardians: add, make primary, remove
 *   - Current placement: roll number; CHANGE SECTION or CHANGE BRANCH from a date, with a reason
 *     ("students.enrolment.transfer"; a branch change needs it at both branches). The old
 *     placement ends the day before and stays in the timeline.
 *   - Timeline: every placement and status change, newest first
 *   - MARK AS LEFT (becomes outgoing: transferred, discontinued, completed) / RE-ADMIT
 *   - Documents, attendance, portal logins; Delete only for mistakes ("students.student.delete")
 */
import {
  ActionForm,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  Input,
  PageHeader,
  Select,
} from '@eduplatform/ui';
import { SectionPicker } from '../../../../components/section-picker';
import { api } from '../../../../lib/api';
import { can, canAt, getMe } from '../../../../lib/me';
import { pickerData } from '../../../../lib/structure';
import type {
  AcademicYear,
  Branch,
  DocumentType,
  StudentAttendance,
  StudentDocuments,
  StudentProfile,
} from '../../../../lib/types';
import {
  addGuardian,
  changeBranch,
  changeSection,
  deleteStudent,
  enrol,
  grantPortalAccess,
  leaveStudent,
  makePrimaryGuardian,
  readmitStudent,
  removeGuardian,
  revokePortalAccess,
  updateEnrolment,
  updateStudent,
} from '../actions';
import {
  ENROLMENT_STATUSES,
  GENDERS,
  LEAVING_STATUSES,
  RELATIONS,
  STUDENT_STATUSES,
} from '../labels';
import { DocumentsCard } from './documents-card';

const isoDate = (value: string) => value.slice(0, 10);
const date = (value: string) => new Date(value).toLocaleDateString();
const today = () => new Date().toISOString().slice(0, 10);

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, student] = await Promise.all([getMe(), api<StudentProfile>(`/students/${id}`)]);
  const place = { branchId: student.branchId };
  const current = student.status === 'ACTIVE';
  const canEdit = canAt(me, 'students.student.update', place);
  const canMove = current && canAt(me, 'students.enrolment.transfer', place);
  const placement = student.enrolments.find((e) => e.status === 'ACTIVE');
  const academic = me.enabledModules.includes('academic') && can(me, 'academic.structure.view');

  // Branches a branch change can go to: open, with the transfer permission there too.
  const otherBranches =
    canMove && placement && can(me, 'platform.branch.view')
      ? (await api<Branch[]>('/branches')).filter(
          (b) =>
            b.id !== student.branchId &&
            b.status === 'ACTIVE' &&
            canAt(me, 'students.enrolment.transfer', { branchId: b.id }),
        )
      : [];
  const needsPicker = academic && current && (canEdit || canMove);
  const [years, picker] = needsPicker
    ? await Promise.all([
        can(me, 'academic.year.view') ? api<AcademicYear[]>('/academic-years') : [],
        pickerData([student.branchId, ...otherBranches.map((b) => b.id)]),
      ])
    : [[], null];
  const ownSections = picker?.sections.filter((s) => s.branchId === student.branchId) ?? [];
  const openYears = years.filter((y) => y.status !== 'CLOSED');

  // Attendance of the last 30 days (Attendance module).
  const until = today();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const attendance =
    me.enabledModules.includes('attendance') && canAt(me, 'attendance.record.view', place)
      ? await api<StudentAttendance>(
          `/students/${student.id}/attendance?${new URLSearchParams({ from: since, to: until })}`,
        )
      : null;

  // Documents (with the right to see them at this branch).
  const canSeeDocuments = canAt(me, 'students.document.view', place);
  const [documents, documentTypes] = canSeeDocuments
    ? await Promise.all([
        api<StudentDocuments>(`/students/${student.id}/documents`),
        api<DocumentType[]>('/document-types'),
      ])
    : [null, []];

  const leaving = student.statusChanges.find((c) => c.toStatus === student.status);

  return (
    <>
      <PageHeader
        back={{
          href: current ? '/students' : '/students?show=outgoing',
          label: 'Back to students',
        }}
        title={`${student.fullName}${student.surname ? ` ${student.surname}` : ''}`}
        description={`${student.admissionNo} · ${student.branch.name}`}
        actions={
          <>
            <Badge variant={current ? 'success' : 'outline'}>
              {current ? 'Current' : `Outgoing · ${STUDENT_STATUSES[student.status]}`}
            </Badge>
            {canAt(me, 'students.student.delete', place) && (
              <ActionForm
                action={deleteStudent.bind(null, student.id)}
                submitLabel="Delete"
                pendingLabel="…"
                confirmMessage={`Delete ${student.fullName}? Only for a student added by mistake; for a student who left, use "Mark as left" instead.`}
                submitVariant="destructive"
                submitSize="sm"
              />
            )}
          </>
        }
      />

      {!current && (
        <div className="mb-6 max-w-3xl rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>
            <span className="font-medium">Outgoing student</span> ·{' '}
            {STUDENT_STATUSES[student.status]}
            {leaving ? ` on ${date(leaving.effectiveOn)}` : ''}
            {leaving?.destination ? ` · went to ${leaving.destination}` : ''}
            {leaving?.reason ? ` · ${leaving.reason}` : ''}
          </p>
          <p className="mt-1 text-xs">
            All records are kept. They are not on registers or in promotion any more.
          </p>
          {canEdit && (
            <ActionForm
              action={readmitStudent.bind(null, student.id)}
              submitLabel="Re-admit"
              confirmMessage={`Re-admit ${student.fullName} as a current student?`}
              className="mt-3 flex-row flex-wrap items-end gap-2"
            >
              <Field label="From" htmlFor="readmitOn">
                <Input
                  id="readmitOn"
                  name="effectiveOn"
                  type="date"
                  required
                  defaultValue={today()}
                />
              </Field>
              <Field label="Reason" htmlFor="readmitReason">
                <Input id="readmitReason" name="reason" placeholder="e.g. Came back" />
              </Field>
            </ActionForm>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* --- Current placement -------------------------------------------------------------- */}
        {current && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Current section</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {placement ? (
                <div className="flex flex-wrap items-end gap-4 text-sm">
                  <div>
                    <p className="font-medium">{placement.section}</p>
                    <p className="text-muted-foreground">
                      {placement.branch.name} · {placement.academicYear.name} · since{' '}
                      {date(placement.enrolledOn)}
                    </p>
                  </div>
                  {canEdit && (
                    <ActionForm
                      action={updateEnrolment.bind(null, student.id, placement.id)}
                      submitLabel="Save roll no"
                      submitVariant="outline"
                      submitSize="sm"
                      className="flex-row items-end gap-2"
                    >
                      <Input
                        name="rollNo"
                        defaultValue={placement.rollNo ?? ''}
                        placeholder="Roll no"
                        className="w-24"
                        aria-label="Roll no"
                      />
                    </ActionForm>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not placed in a section yet.</p>
              )}

              {picker && placement && canMove && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <details className="rounded-md border p-3 text-sm">
                    <summary className="cursor-pointer font-medium text-primary">
                      Change section
                    </summary>
                    <ActionForm
                      action={changeSection.bind(null, student.id)}
                      submitLabel="Change section"
                      confirmMessage="Change the section from the chosen day? The old section stays in the history."
                      className="mt-3"
                    >
                      <SectionPicker
                        {...picker}
                        sections={ownSections}
                        name="classId"
                        required
                        defaultSectionId={placement.classId}
                      />
                      <ChangeFields />
                    </ActionForm>
                  </details>
                  {otherBranches.length > 0 && (
                    <details className="rounded-md border p-3 text-sm">
                      <summary className="cursor-pointer font-medium text-primary">
                        Change branch
                      </summary>
                      <ActionForm
                        action={changeBranch.bind(null, student.id)}
                        submitLabel="Change branch"
                        confirmMessage="Move this student to the chosen branch from that day? The old branch keeps the history."
                        className="mt-3"
                      >
                        <SectionPicker
                          {...picker}
                          branches={otherBranches}
                          name="classId"
                          required
                        />
                        <ChangeFields />
                      </ActionForm>
                    </details>
                  )}
                </div>
              )}

              {picker && !placement && canEdit && openYears.length > 0 && (
                <ActionForm action={enrol.bind(null, student.id)} submitLabel="Place in section">
                  <SectionPicker {...picker} sections={ownSections} name="classId" required />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Academic year" htmlFor="academicYearId">
                      <Select
                        id="academicYearId"
                        name="academicYearId"
                        required
                        defaultValue={openYears.find((y) => y.status === 'ACTIVE')?.id}
                      >
                        {openYears.map((y) => (
                          <option key={y.id} value={y.id}>
                            {y.name}
                            {y.status === 'ACTIVE' ? ' · current' : ''}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Roll no" htmlFor="enrolRollNo">
                      <Input id="enrolRollNo" name="rollNo" />
                    </Field>
                  </div>
                </ActionForm>
              )}
            </CardContent>
          </Card>
        )}

        {/* --- Profile --------------------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {canEdit ? (
              <ActionForm action={updateStudent.bind(null, student.id)} submitLabel="Save">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" htmlFor="fullName">
                    <Input id="fullName" name="fullName" defaultValue={student.fullName} required />
                  </Field>
                  <Field label="Surname" htmlFor="surname">
                    <Input id="surname" name="surname" defaultValue={student.surname ?? ''} />
                  </Field>
                  <Field label="Date of birth" htmlFor="dateOfBirth">
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      defaultValue={isoDate(student.dateOfBirth)}
                    />
                  </Field>
                  <Field label="Gender" htmlFor="gender">
                    <Select id="gender" name="gender" defaultValue={student.gender}>
                      {Object.entries(GENDERS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Phone" htmlFor="phone">
                    <Input id="phone" name="phone" defaultValue={student.phone ?? ''} />
                  </Field>
                  <Field label="Email" htmlFor="email">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={student.email ?? ''}
                    />
                  </Field>
                  <Field label="Blood group" htmlFor="bloodGroup">
                    <Input
                      id="bloodGroup"
                      name="bloodGroup"
                      defaultValue={student.bloodGroup ?? ''}
                    />
                  </Field>
                  <Field
                    label="Admission no"
                    htmlFor="admissionNo"
                    hint="Only to correct a mistake"
                  >
                    <Input id="admissionNo" name="admissionNo" defaultValue={student.admissionNo} />
                  </Field>
                  <Field label="Previous school / college" htmlFor="previousInstitution">
                    <Input
                      id="previousInstitution"
                      name="previousInstitution"
                      defaultValue={student.previousInstitution ?? ''}
                    />
                  </Field>
                  <Field label="Previous marks" htmlFor="previousMarks">
                    <Input
                      id="previousMarks"
                      name="previousMarks"
                      defaultValue={student.previousMarks ?? ''}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Address" htmlFor="address">
                      <Input id="address" name="address" defaultValue={student.address ?? ''} />
                    </Field>
                  </div>
                </div>
              </ActionForm>
            ) : (
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Date of birth</dt>
                <dd>{date(student.dateOfBirth)}</dd>
                <dt className="text-muted-foreground">Gender</dt>
                <dd>{GENDERS[student.gender]}</dd>
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{student.phone ?? '—'}</dd>
                <dt className="text-muted-foreground">Previous school / college</dt>
                <dd>{student.previousInstitution ?? '—'}</dd>
              </dl>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Admitted on {date(student.admissionDate)}
            </p>
          </CardContent>
        </Card>

        {/* --- Guardians ------------------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Parents / guardians</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {student.guardians.length === 0 && (
              <p className="text-sm text-muted-foreground">None yet.</p>
            )}
            {student.guardians.map((g) => (
              <div key={g.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{g.guardian.fullName}</span>
                <span className="text-muted-foreground">
                  {RELATIONS[g.relation]}
                  {g.guardian.phone ? ` · ${g.guardian.phone}` : ''}
                </span>
                {g.isPrimary && <Badge variant="success">Primary</Badge>}
                {canEdit && !g.isPrimary && (
                  <ActionForm
                    action={makePrimaryGuardian.bind(null, student.id, g.guardian.id)}
                    submitLabel="Make primary"
                    pendingLabel="…"
                    submitVariant="ghost"
                    submitSize="sm"
                  />
                )}
                {canEdit && (
                  <ActionForm
                    action={removeGuardian.bind(null, student.id, g.guardian.id)}
                    submitLabel="Remove"
                    pendingLabel="…"
                    confirmMessage={`Remove ${g.guardian.fullName} from this student?`}
                    submitVariant="destructive"
                    submitSize="sm"
                  />
                )}
              </div>
            ))}
            {canEdit && (
              <details className="text-sm">
                <summary className="cursor-pointer text-primary">+ Add parent / guardian</summary>
                <ActionForm
                  action={addGuardian.bind(null, student.id)}
                  submitLabel="Add"
                  resetOnSuccess
                  className="mt-3"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Name" htmlFor="gName">
                      <Input id="gName" name="fullName" required />
                    </Field>
                    <Field label="Relation" htmlFor="gRelation">
                      <Select id="gRelation" name="relation">
                        {Object.entries(RELATIONS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Phone" htmlFor="gPhone">
                      <Input id="gPhone" name="phone" />
                    </Field>
                    <Field label="Email" htmlFor="gEmail">
                      <Input id="gEmail" name="email" type="email" />
                    </Field>
                    <Field label="Occupation" htmlFor="gOccupation">
                      <Input id="gOccupation" name="occupation" />
                    </Field>
                  </div>
                  <Checkbox name="isPrimary" label="Main contact for this student" />
                </ActionForm>
              </details>
            )}
          </CardContent>
        </Card>

        {/* --- Timeline ------------------------------------------------------------------------ */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline student={student} />
          </CardContent>
        </Card>

        {/* --- Leaving ------------------------------------------------------------------------- */}
        {current && canEdit && (
          <Card>
            <CardHeader>
              <CardTitle>Mark as left</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm
                action={leaveStudent.bind(null, student.id)}
                submitLabel="Mark as left"
                submitVariant="destructive"
                confirmMessage={`Mark ${student.fullName} as left? They become outgoing: off registers and promotion, records kept, portal login closed.`}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Why" htmlFor="status">
                    <Select id="status" name="status">
                      {Object.entries(LEAVING_STATUSES).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Left on" htmlFor="leftOn">
                    <Input
                      id="leftOn"
                      name="effectiveOn"
                      type="date"
                      required
                      defaultValue={today()}
                    />
                  </Field>
                  <Field label="Went to (if known)" htmlFor="destination">
                    <Input
                      id="destination"
                      name="destination"
                      placeholder="e.g. Narayana JC, Vizag"
                    />
                  </Field>
                  <Field label="Reason" htmlFor="leaveReason">
                    <Input id="leaveReason" name="reason" placeholder="e.g. Family moved" />
                  </Field>
                </div>
              </ActionForm>
            </CardContent>
          </Card>
        )}
      </div>

      {documents && (
        <DocumentsCard
          studentId={student.id}
          data={documents}
          types={documentTypes}
          can={{
            upload: canAt(me, 'students.document.create', place),
            review: canAt(me, 'students.document.update', place),
            delete: canAt(me, 'students.document.delete', place),
          }}
        />
      )}

      {/* --- Attendance ------------------------------------------------------------------------ */}
      {attendance && (
        <Card className="mt-6 max-w-xl">
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
            {attendance.days
              .filter((d) => d.status !== 'PRESENT')
              .slice(0, 10)
              .map((d) => (
                <p key={d.date} className="text-xs text-muted-foreground">
                  {d.date}: {d.status.replace('_', ' ').toLowerCase()}
                  {d.remark ? ` (${d.remark})` : ''}
                  {d.corrected && d.correctionReason ? ` · corrected: ${d.correctionReason}` : ''}
                </p>
              ))}
          </CardContent>
        </Card>
      )}

      {/* --- Portal logins --------------------------------------------------------------------- */}
      {canEdit && current && me.enabledModules.includes('portal') && (
        <PortalAccess student={student} />
      )}
    </>
  );
}

/** The date, reason and roll number of a section / branch change. */
function ChangeFields() {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-3">
      <Field label="From" htmlFor="changeOn" hint="First day in the new section">
        <Input id="changeOn" name="effectiveOn" type="date" required defaultValue={today()} />
      </Field>
      <Field label="Reason" htmlFor="changeReason">
        <Input id="changeReason" name="reason" placeholder="e.g. Cleared the entrance test" />
      </Field>
      <Field label="Roll no" htmlFor="changeRollNo">
        <Input id="changeRollNo" name="rollNo" />
      </Field>
    </div>
  );
}

/** Placements and status changes in one list, newest first. */
function Timeline({ student }: { student: StudentProfile }) {
  const entries = [
    ...student.enrolments.map((e) => ({
      key: e.id,
      on: e.enrolledOn,
      title: e.section,
      detail: [
        e.branch.name,
        e.academicYear.name,
        e.rollNo ? `roll ${e.rollNo}` : null,
        e.endedOn ? `until ${date(e.endedOn)}` : null,
        e.reason,
      ]
        .filter(Boolean)
        .join(' · '),
      badge: ENROLMENT_STATUSES[e.status],
      current: e.status === 'ACTIVE',
    })),
    ...student.statusChanges.map((c) => ({
      key: c.id,
      on: c.effectiveOn,
      title: c.fromStatus === null ? 'Admitted' : STUDENT_STATUSES[c.toStatus],
      detail: [c.reason, c.destination ? `went to ${c.destination}` : null]
        .filter(Boolean)
        .join(' · '),
      badge: null,
      current: false,
    })),
  ].sort((a, b) => b.on.localeCompare(a.on));
  return (
    <ol className="flex flex-col gap-3 border-l pl-4 text-sm">
      {entries.map((e) => (
        <li key={e.key} className="relative">
          <span
            className={`absolute -left-[21px] top-1.5 size-2.5 rounded-full ${
              e.current ? 'bg-success' : 'bg-muted-foreground/40'
            }`}
          />
          <p>
            <span className="text-muted-foreground">{date(e.on)}</span>{' '}
            <span className="font-medium">{e.title}</span>
            {e.badge && (
              <Badge variant={e.current ? 'success' : 'outline'} className="ml-2">
                {e.badge}
              </Badge>
            )}
          </p>
          {e.detail && <p className="text-xs text-muted-foreground">{e.detail}</p>}
        </li>
      ))}
    </ol>
  );
}

/**
 * The student's and their guardians' portal logins: who has one (with Remove), and a form to
 * give one. A guardian's login covers all their children.
 */
function PortalAccess({ student }: { student: StudentProfile }) {
  const logins = [
    ...(student.login ? [{ who: `${student.fullName} (student)`, login: student.login }] : []),
    ...student.guardians
      .filter((g) => g.guardian.login)
      .map((g) => ({
        who: `${g.guardian.fullName} (${RELATIONS[g.relation]})`,
        login: g.guardian.login!,
      })),
  ];
  const options = [
    ...(student.login ? [] : [{ value: 'STUDENT', label: `${student.fullName} (student)` }]),
    ...student.guardians
      .filter((g) => !g.guardian.login)
      .map((g) => ({
        value: `GUARDIAN:${g.guardian.id}`,
        label: `${g.guardian.fullName} (${RELATIONS[g.relation]})`,
      })),
  ];
  return (
    <Card className="mt-6 max-w-xl">
      <CardHeader>
        <CardTitle>Parent / student portal logins</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        {logins.length === 0 && <p className="text-muted-foreground">No logins yet.</p>}
        {logins.map(({ who, login }) => (
          <div key={login.id} className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{who}</span>
            <span className="text-muted-foreground">{login.email}</span>
            {login.status !== 'ACTIVE' && <Badge variant="outline">Closed</Badge>}
            <ActionForm
              action={revokePortalAccess.bind(null, student.id, login.id)}
              submitLabel="Remove"
              pendingLabel="…"
              confirmMessage={`Remove the login ${login.email}? They will no longer be able to log in.`}
              submitVariant="destructive"
              submitSize="sm"
            />
          </div>
        ))}
        {options.length > 0 && (
          <details>
            <summary className="cursor-pointer text-primary">+ Give a portal login</summary>
            <ActionForm
              action={grantPortalAccess.bind(null, student.id)}
              submitLabel="Create login"
              resetOnSuccess
              className="mt-3"
            >
              <Field
                label="For"
                htmlFor="portalFor"
                hint="A parent's login covers all their children"
              >
                <Select id="portalFor" name="for">
                  {options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Email (their login)" htmlFor="portalEmail">
                <Input id="portalEmail" name="email" type="email" required />
              </Field>
              <Field
                label="Temporary password"
                htmlFor="portalPassword"
                hint="At least 10 characters"
              >
                <Input id="portalPassword" name="password" type="text" minLength={10} required />
              </Field>
            </ActionForm>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
