/**
 * /students/new: admit a student. Only the campus, admission number and date, name, date of
 * birth and gender are required; batch, section (for an academic year) and the first guardian
 * can be given now or later on the student's page.
 * Only campuses where you may admit students are offered; the API checks everything again.
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
import { api } from '../../../../lib/api';
import { can, canAt, getMe } from '../../../../lib/me';
import { sectionOptions } from '../../../../lib/sections';
import type { AcademicYear, Batch, Institution } from '../../../../lib/types';
import { admitStudent } from '../actions';
import { GENDERS, RELATIONS } from '../labels';
import { campusesInUse } from '../../../../lib/places';

export default async function AdmitStudentPage() {
  const me = await getMe();
  const institutions = can(me, 'platform.institution.view')
    ? await api<Institution[]>('/institutions')
    : [];
  const campuses = institutions.flatMap((i) =>
    campusesInUse(i)
      .filter((c) => canAt(me, 'students.student.create', { institutionId: i.id, campusId: c.id }))
      .map((c) => ({ ...c, institution: i })),
  );
  if (campuses.length === 0) {
    return (
      <>
        <PageHeader title="Admit student" />
        <EmptyState
          icon={<UserPlus />}
          title="No campus to admit to"
          description="Your roles don't allow admitting students at any campus."
        />
      </>
    );
  }

  const academic = me.enabledModules.includes('academic');
  const [years, batches, sections] = academic
    ? await Promise.all([
        can(me, 'academic.year.view') ? api<AcademicYear[]>('/academic-years') : [],
        can(me, 'academic.batch.view') ? api<Batch[]>('/batches') : [],
        can(me, 'academic.structure.view') ? sectionOptions(campuses.map((c) => c.id)) : [],
      ])
    : [[], [], []];
  const openYears = years.filter((y) => y.status !== 'CLOSED');
  const campusName = new Map(campuses.map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader title="Admit student" description="Fields marked * are required." />
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
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field label="Campus *" htmlFor="campusId">
              <Select id="campusId" name="campusId" required>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.institution.name})
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Admission no"
              htmlFor="admissionNo"
              hint="Leave empty to use the next number (if your institution has automatic numbering)"
            >
              <Input id="admissionNo" name="admissionNo" placeholder="SVJC260001" />
            </Field>
            <Field label="Admission date *" htmlFor="admissionDate">
              <Input id="admissionDate" name="admissionDate" type="date" required />
            </Field>
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

        {academic && (
          <Card>
            <CardHeader>
              <CardTitle>Batch and section (optional)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Batch" htmlFor="batchId">
                <Select id="batchId" name="batchId">
                  <option value="">—</option>
                  {batches
                    .filter((b) => b.status === 'ACTIVE')
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} · {b.stage} ({b.institution.name})
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Academic year" htmlFor="academicYearId">
                <Select id="academicYearId" name="academicYearId">
                  <option value="">—</option>
                  {openYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name} ({y.institution.name}){y.status === 'ACTIVE' ? ' · current' : ''}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Section" htmlFor="sectionId" hint="Must be on the chosen campus">
                <Select id="sectionId" name="sectionId">
                  <option value="">—</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {campusName.get(s.campusId)} · {s.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Roll no" htmlFor="rollNo">
                <Input id="rollNo" name="rollNo" />
              </Field>
            </CardContent>
          </Card>
        )}

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
