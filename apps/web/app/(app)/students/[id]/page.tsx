/**
 * /students/:id: one student.
 *   - Profile (edit with "students.student.update" at the student's campus)
 *   - Parents / guardians: add, make primary, remove
 *   - Sections: one per academic year; place in a section, change roll no, move to another
 *     section ("students.enrolment.transfer")
 *   - Status with its history (Active / Transferred / Discontinued / Alumni)
 *   - Delete: only for mistakes ("students.student.delete")
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
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import { can, canAt, getMe } from '../../../../lib/me';
import { sectionOptions } from '../../../../lib/sections';
import type { AcademicYear, Batch, Institution, StudentProfile } from '../../../../lib/types';
import {
  addGuardian,
  changeStatus,
  deleteStudent,
  enrol,
  makePrimaryGuardian,
  removeGuardian,
  transferCampus,
  updateEnrolment,
  updateStudent,
} from '../actions';
import { GENDERS, RELATIONS, sectionLabel, STUDENT_STATUSES } from '../labels';

const isoDate = (value: string) => value.slice(0, 10);

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, student] = await Promise.all([getMe(), api<StudentProfile>(`/students/${id}`)]);
  const place = { institutionId: student.institutionId, campusId: student.campusId };
  const canEdit = canAt(me, 'students.student.update', place);
  const canMove = canAt(me, 'students.enrolment.transfer', place);
  const academic = me.enabledModules.includes('academic');

  const [years, batches, sections] =
    academic && (canEdit || canMove)
      ? await Promise.all([
          can(me, 'academic.year.view')
            ? api<AcademicYear[]>(`/academic-years?institutionId=${student.institutionId}`)
            : [],
          can(me, 'academic.batch.view')
            ? api<Batch[]>(`/batches?institutionId=${student.institutionId}`)
            : [],
          can(me, 'academic.structure.view') ? sectionOptions([student.campusId]) : [],
        ])
      : [[], [], []];
  // Other campuses of the same institution the student can move to (transfer allowed at both).
  const otherCampuses =
    canMove && can(me, 'platform.institution.view')
      ? (await api<Institution[]>('/institutions'))
          .filter((i) => i.id === student.institutionId)
          .flatMap((i) => i.campuses)
          .filter(
            (c) =>
              c.id !== student.campusId &&
              canAt(me, 'students.enrolment.transfer', {
                institutionId: student.institutionId,
                campusId: c.id,
              }),
          )
      : [];
  const otherSections =
    otherCampuses.length > 0 && can(me, 'academic.structure.view')
      ? await sectionOptions(otherCampuses.map((c) => c.id))
      : [];
  const hasCurrentSection = student.enrolments.some(
    (e) => e.status === 'ACTIVE' && e.academicYear.status !== 'CLOSED',
  );
  // With a current section, only campuses that have sections to move into.
  const targetCampuses = hasCurrentSection
    ? otherCampuses.filter((c) => otherSections.some((s) => s.campusId === c.id))
    : otherCampuses;

  const yearsWithout = years.filter(
    (y) => y.status !== 'CLOSED' && !student.enrolments.some((e) => e.academicYear.id === y.id),
  );

  return (
    <>
      <PageHeader
        title={`${student.fullName}${student.surname ? ` ${student.surname}` : ''}`}
        description={`${student.admissionNo} · ${student.campus.name} (${student.institution.name})`}
        actions={
          <>
            <Badge variant={student.status === 'ACTIVE' ? 'success' : 'outline'}>
              {STUDENT_STATUSES[student.status]}
            </Badge>
            {canAt(me, 'students.student.delete', place) && (
              <ActionForm
                action={deleteStudent.bind(null, student.id)}
                submitLabel="Delete"
                pendingLabel="…"
                confirmMessage={`Delete ${student.fullName}? Only for a student added by mistake; for a student who left, change the status instead.`}
                submitVariant="ghost"
                submitSize="sm"
              />
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
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
                  {academic && (
                    <Field label="Batch" htmlFor="batchId">
                      <Select id="batchId" name="batchId" defaultValue={student.batchId ?? ''}>
                        <option value="">—</option>
                        {batches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} · {b.stage}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  )}
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
                <dd>{new Date(student.dateOfBirth).toLocaleDateString()}</dd>
                <dt className="text-muted-foreground">Gender</dt>
                <dd>{GENDERS[student.gender]}</dd>
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{student.phone ?? '—'}</dd>
                <dt className="text-muted-foreground">Batch</dt>
                <dd>{student.batch ? `${student.batch.name} · ${student.batch.stage}` : '—'}</dd>
              </dl>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Admitted on {new Date(student.admissionDate).toLocaleDateString()}
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
                    submitVariant="ghost"
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
      </div>

      {/* --- Sections per academic year ------------------------------------------------------ */}
      <h2 className="mb-3 mt-8 text-lg font-semibold">Sections</h2>
      <Table>
        <TableHead>
          <tr>
            <Th>Academic year</Th>
            <Th>Section</Th>
            <Th>Roll no</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </TableHead>
        <tbody>
          {student.enrolments.map((e) => (
            <tr key={e.id}>
              <Td>{e.academicYear.name}</Td>
              <Td>{sectionLabel(e.class)}</Td>
              <Td>{e.rollNo ?? '—'}</Td>
              <Td>
                <Badge variant={e.status === 'ACTIVE' ? 'success' : 'outline'}>{e.status}</Badge>
              </Td>
              <Td className="text-right">
                {e.status === 'ACTIVE' && (canEdit || canMove) && (
                  <ActionForm
                    action={updateEnrolment.bind(null, student.id, e.id)}
                    submitLabel="Save"
                    submitVariant="outline"
                    submitSize="sm"
                    className="flex-row items-center justify-end gap-2"
                  >
                    {canMove && (
                      <Select
                        name="sectionId"
                        defaultValue={e.class.id}
                        className="w-56"
                        aria-label="Section"
                      >
                        {sections.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </Select>
                    )}
                    {canEdit && (
                      <Input
                        name="rollNo"
                        defaultValue={e.rollNo ?? ''}
                        placeholder="Roll no"
                        className="w-24"
                        aria-label="Roll no"
                      />
                    )}
                  </ActionForm>
                )}
              </Td>
            </tr>
          ))}
          {student.enrolments.length === 0 && (
            <tr>
              <Td colSpan={5} className="py-6 text-center text-muted-foreground">
                Not placed in a section yet.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
      {canEdit && student.status === 'ACTIVE' && yearsWithout.length > 0 && sections.length > 0 && (
        <Card className="mt-4 max-w-xl">
          <CardHeader>
            <CardTitle>Place in a section</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={enrol.bind(null, student.id)} submitLabel="Place">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Academic year" htmlFor="academicYearId">
                  <Select id="academicYearId" name="academicYearId" required>
                    {yearsWithout.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name}
                        {y.status === 'ACTIVE' ? ' · current' : ''}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Section" htmlFor="sectionId">
                  <Select id="sectionId" name="sectionId" required>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Roll no" htmlFor="enrolRollNo">
                  <Input id="enrolRollNo" name="rollNo" />
                </Field>
              </div>
            </ActionForm>
          </CardContent>
        </Card>
      )}

      {/* --- Move to another campus ------------------------------------------------------------ */}
      {targetCampuses.length > 0 && (
        <Card className="mt-6 max-w-xl">
          <CardHeader>
            <CardTitle>Move to another campus</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm
              action={transferCampus.bind(null, student.id)}
              submitLabel="Move"
              confirmMessage={`Move ${student.fullName} to the chosen campus?`}
            >
              <Field
                label="To"
                htmlFor="to"
                hint={
                  hasCurrentSection ? 'Their current section moves to the chosen one' : undefined
                }
              >
                <Select id="to" name="to" required>
                  {targetCampuses.map((c) =>
                    hasCurrentSection ? (
                      <optgroup key={c.id} label={c.name}>
                        {otherSections
                          .filter((s) => s.campusId === c.id)
                          .map((s) => (
                            <option key={s.id} value={`${c.id}:${s.id}`}>
                              {s.label}
                            </option>
                          ))}
                      </optgroup>
                    ) : (
                      <option key={c.id} value={`${c.id}:`}>
                        {c.name}
                      </option>
                    ),
                  )}
                </Select>
              </Field>
              <Field label="Reason" htmlFor="transferReason">
                <Input id="transferReason" name="reason" placeholder="e.g. Closer to home" />
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
      )}

      {/* --- Status ---------------------------------------------------------------------------- */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status history</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {student.statusChanges.map((c) => (
                <li key={c.id}>
                  <span className="font-medium">{STUDENT_STATUSES[c.toStatus]}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    from {new Date(c.effectiveOn).toLocaleDateString()}
                    {c.reason ? ` · ${c.reason}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        {canEdit && (
          <Card>
            <CardHeader>
              <CardTitle>Change status</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm
                action={changeStatus.bind(null, student.id)}
                submitLabel="Change status"
                confirmMessage="Change this student's status? Leaving also ends their current section."
                resetOnSuccess
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="New status" htmlFor="status">
                    <Select id="status" name="status">
                      {Object.entries(STUDENT_STATUSES)
                        .filter(([value]) => value !== student.status)
                        .map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                    </Select>
                  </Field>
                  <Field label="From" htmlFor="effectiveOn">
                    <Input id="effectiveOn" name="effectiveOn" type="date" required />
                  </Field>
                </div>
                <Field label="Reason" htmlFor="reason">
                  <Input id="reason" name="reason" placeholder="e.g. Moved to another city" />
                </Field>
              </ActionForm>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
