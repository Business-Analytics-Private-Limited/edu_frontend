/**
 * /students/:id/edit: edit one student's details (ADR-0031), opened from the pencil on the
 * Students list or "Edit" on the student's page. The same fields and browser checks as "Add
 * student" (components/student-fields.tsx); emptying an optional field clears it. Sensitive
 * details only appear for users with "students.sensitive.view"; without it they stay as they
 * are. The admission number can be corrected when the organization types them (MANUAL).
 * Section, branch, parents and leaving are changed on the student's page, not here.
 * Needs "students.student.update" at the student's branch; the API checks it again.
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
} from '@eduplatform/ui';
import { Pencil } from 'lucide-react';
import { StudentFields } from '../../../../../components/student-fields';
import { api } from '../../../../../lib/api';
import { canAt, getMe } from '../../../../../lib/me';
import { ADMISSION_NO_PATTERN, ADMISSION_NO_TITLE } from '../../../../../lib/student-rules';
import type { OwnOrganization, StudentProfile } from '../../../../../lib/types';
import { updateStudent } from '../../actions';

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, student, organization] = await Promise.all([
    getMe(),
    api<StudentProfile>(`/students/${id}`),
    api<OwnOrganization>('/organization'),
  ]);
  const back = { href: `/students/${id}`, label: `Back to ${student.fullName}` };
  if (!canAt(me, 'students.student.update', { branchId: student.branchId })) {
    return (
      <>
        <PageHeader back={back} title={`Edit ${student.fullName}`} />
        <EmptyState
          icon={<Pencil />}
          title="You can't edit this student"
          description="Your roles don't allow editing students at this branch."
        />
      </>
    );
  }
  const manual = organization.admissionNumbering === 'MANUAL';

  return (
    <>
      <PageHeader
        back={back}
        title={`Edit ${student.fullName}`}
        description={`${student.admissionNo} · ${student.branch.name}. Fields marked * are required; emptying a field clears it.`}
      />
      <ActionForm
        action={updateStudent.bind(null, student.id)}
        submitLabel="Save changes"
        className="max-w-3xl gap-6"
      >
        {manual && (
          <Card>
            <CardHeader>
              <CardTitle>Admission</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Admission no *" htmlFor="admissionNo" hint="Only to correct a mistake">
                <Input
                  id="admissionNo"
                  name="admissionNo"
                  required
                  maxLength={30}
                  pattern={ADMISSION_NO_PATTERN}
                  title={ADMISSION_NO_TITLE}
                  defaultValue={student.admissionNo}
                />
              </Field>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Student details</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentFields
              defaults={student}
              showSensitive={student.sensitiveVisible}
              admittedOn={student.admissionDate.slice(0, 10)}
            />
          </CardContent>
        </Card>
      </ActionForm>
    </>
  );
}
