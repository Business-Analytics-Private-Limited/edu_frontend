/**
 * /students/new: admit a student (ADR-0030). Required: branch, admission date, name, date of
 * birth and gender; the admission number too when the organization types them (MANUAL).
 * The section is chosen step by step (branch → year → group → stream → section) and is optional;
 * a student can join straight into a later year (lateral entry: previous school and marks).
 * Only branches where you may admit students are offered; the API checks everything again.
 */
import {
  ActionForm,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
} from '@eduplatform/ui';
import { UserPlus } from 'lucide-react';
import { SectionPicker } from '../../../../components/section-picker';
import { api } from '../../../../lib/api';
import { can, getMe } from '../../../../lib/me';
import { branchesForWork } from '../../../../lib/places';
import { pickerData } from '../../../../lib/structure';
import type { AcademicYear, Branch, OwnOrganization } from '../../../../lib/types';
import { admitStudent } from '../actions';
import { GENDERS, RELATIONS } from '../labels';

export default async function AdmitStudentPage() {
  const me = await getMe();
  const [allBranches, organization] = await Promise.all([
    can(me, 'platform.branch.view') ? api<Branch[]>('/branches') : [],
    api<OwnOrganization>('/organization'),
  ]);
  const branches = branchesForWork(me, allBranches, 'students.student.create');
  if (branches.length === 0) {
    return (
      <>
        <PageHeader back={{ href: '/students', label: 'Back to students' }} title="Admit student" />
        <EmptyState
          icon={<UserPlus />}
          title="No branch to admit to"
          description="Your roles do not allow admitting students at any branch."
        />
      </>
    );
  }

  const academic = me.enabledModules.includes('academic') && can(me, 'academic.structure.view');
  const [years, picker] = academic
    ? await Promise.all([
        can(me, 'academic.year.view') ? api<AcademicYear[]>('/academic-years') : [],
        pickerData(branches.map((b) => b.id)),
      ])
    : [[], null];
  const openYears = years.filter((y) => y.status !== 'CLOSED');
  const manual = organization.admissionNumbering === 'MANUAL';

  return (
    <>
      <PageHeader
        back={{ href: '/students', label: 'Back to students' }}
        title="Admit student"
        description="Fields marked * are required."
      />
      <ActionForm
        action={admitStudent}
        submitLabel="Admit student"
        pendingLabel="Admitting…"
        className="max-w-3xl gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Admission</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {manual ? (
              <Field label="Admission no *" htmlFor="admissionNo">
                <Input id="admissionNo" name="admissionNo" required placeholder="SVJC260001" />
              </Field>
            ) : (
              <Field label="Admission no" htmlFor="admissionNo-auto">
                <Input
                  id="admissionNo-auto"
                  disabled
                  value={`Automatic (${organization.admissionNoPattern})`}
                />
              </Field>
            )}
            <Field label="Admission date *" htmlFor="admissionDate">
              <Input id="admissionDate" name="admissionDate" type="date" required />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branch and section</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {picker ? (
              <>
                <SectionPicker
                  {...picker}
                  branches={branches}
                  name="classId"
                  emptyLabel="Not placed yet"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Academic year"
                    htmlFor="academicYearId"
                    hint="Needed when a section is chosen"
                  >
                    <Select
                      id="academicYearId"
                      name="academicYearId"
                      defaultValue={openYears.find((y) => y.status === 'ACTIVE')?.id ?? ''}
                    >
                      <option value="">—</option>
                      {openYears.map((y) => (
                        <option key={y.id} value={y.id}>
                          {y.name}
                          {y.status === 'ACTIVE' ? ' · current' : ''}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Roll no" htmlFor="rollNo">
                    <Input id="rollNo" name="rollNo" />
                  </Field>
                </div>
              </>
            ) : (
              <Field label="Branch *" htmlFor="branchId">
                <Select id="branchId" name="branchId" required>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name *" htmlFor="fullName" hint="As in official records">
              <Input id="fullName" name="fullName" required minLength={2} />
            </Field>
            <Field label="Surname" htmlFor="surname">
              <Input id="surname" name="surname" />
            </Field>
            <Field label="Date of birth *" htmlFor="dateOfBirth">
              <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
            </Field>
            <Field label="Gender *" htmlFor="gender">
              <Select id="gender" name="gender" required>
                {Object.entries(GENDERS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Phone" htmlFor="phone">
              <Input id="phone" name="phone" />
            </Field>
            <Field label="Email" htmlFor="email">
              <Input id="email" name="email" type="email" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address" htmlFor="address">
                <Input id="address" name="address" />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Joining in a later year (optional)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Previous school / college" htmlFor="previousInstitution">
              <Input id="previousInstitution" name="previousInstitution" />
            </Field>
            <Field label="Previous marks" htmlFor="previousMarks" hint="e.g. 1st year: 845/1000">
              <Input id="previousMarks" name="previousMarks" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parent / guardian (optional)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field label="Name" htmlFor="guardianName">
              <Input id="guardianName" name="guardianName" />
            </Field>
            <Field label="Relation" htmlFor="guardianRelation">
              <Select id="guardianRelation" name="guardianRelation">
                {Object.entries(RELATIONS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Phone" htmlFor="guardianPhone">
              <Input id="guardianPhone" name="guardianPhone" />
            </Field>
          </CardContent>
        </Card>
      </ActionForm>
    </>
  );
}
