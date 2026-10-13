/**
 * /students/new: add (admit) one student (ADR-0030, ADR-0031). Required: branch, admission date,
 * full name, date of birth and gender; the admission number too when the organization types them
 * (MANUAL). The section is chosen step by step (branch → year → group → stream → section) and is
 * optional; a student can join straight into a later year (lateral entry: previous education).
 * Every other detail is optional (components/student-fields.tsx), and father, mother and guardian
 * can be added. The browser checks each field; the API checks everything again.
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
import { StudentFields } from '../../../../components/student-fields';
import { api } from '../../../../lib/api';
import { can, getMe } from '../../../../lib/me';
import { branchesForWork } from '../../../../lib/places';
import { pickerData } from '../../../../lib/structure';
import type { AcademicYear, Branch, OwnOrganization } from '../../../../lib/types';
import {
  ADMISSION_NO_PATTERN,
  ADMISSION_NO_TITLE,
  NAME_PATTERN,
  NAME_TITLE,
  PHONE_PATTERN,
  PHONE_TITLE,
} from '../../../../lib/student-rules';
import { admitStudent } from '../actions';

const PARENT_LABELS = { father: 'Father', mother: 'Mother', guardian: 'Guardian' } as const;

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
        <PageHeader back={{ href: '/students', label: 'Back to students' }} title="Add student" />
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
        title="Add student"
        description="Fields marked * are required; everything else can be filled in later."
      />
      <ActionForm
        action={admitStudent}
        submitLabel="Add student"
        pendingLabel="Adding…"
        className="max-w-3xl gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Admission</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {manual ? (
              <Field label="Admission no *" htmlFor="admissionNo">
                <Input
                  id="admissionNo"
                  name="admissionNo"
                  required
                  maxLength={30}
                  pattern={ADMISSION_NO_PATTERN}
                  title={ADMISSION_NO_TITLE}
                  placeholder="SVJC260001"
                />
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
              <Input
                id="admissionDate"
                name="admissionDate"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
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
                    <Input id="rollNo" name="rollNo" maxLength={20} />
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
            <CardTitle>Student details</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentFields showSensitive />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parents / guardians (optional)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {(['father', 'mother', 'guardian'] as const).map((who) => (
              <div key={who} className="grid gap-3 sm:grid-cols-3">
                <Field label={`${PARENT_LABELS[who]}: name`} htmlFor={`${who}Name`}>
                  <Input
                    id={`${who}Name`}
                    name={`${who}Name`}
                    minLength={2}
                    maxLength={100}
                    pattern={NAME_PATTERN}
                    title={NAME_TITLE}
                  />
                </Field>
                <Field label="Phone" htmlFor={`${who}Phone`}>
                  <Input
                    id={`${who}Phone`}
                    name={`${who}Phone`}
                    type="tel"
                    pattern={PHONE_PATTERN}
                    title={PHONE_TITLE}
                  />
                </Field>
                <Field label="Occupation" htmlFor={`${who}Occupation`}>
                  <Input
                    id={`${who}Occupation`}
                    name={`${who}Occupation`}
                    minLength={2}
                    maxLength={50}
                  />
                </Field>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              The first one filled in is the main contact. Phone and occupation need a name.
            </p>
          </CardContent>
        </Card>
      </ActionForm>
    </>
  );
}
