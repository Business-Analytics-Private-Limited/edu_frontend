/**
 * /students/new: add (admit) one student, step by step (ADR-0030, ADR-0031). The wizard
 * (admission-wizard.tsx) walks through Placement → Student → Contact → Family → Background →
 * More → Review inside one form; this page loads what it needs and sends the form to
 * admitStudent (actions.ts), which opens the new student's page.
 * Required: branch, admission date, full name, date of birth, gender; the admission number
 * too when the organization types them (MANUAL). Everything else is optional.
 * Only branches where you may admit students are offered; the API checks everything again.
 */
import { ActionForm, EmptyState, PageHeader } from '@eduplatform/ui';
import { UserPlus } from 'lucide-react';
import { api } from '../../../../lib/api';
import { can, getMe } from '../../../../lib/me';
import { branchesForWork } from '../../../../lib/places';
import { pickerData } from '../../../../lib/structure';
import type { AcademicYear, Branch, OwnOrganization } from '../../../../lib/types';
import { admitStudent } from '../actions';
import { AdmissionWizard } from './admission-wizard';

export default async function AddStudentPage() {
  const me = await getMe();
  const [allBranches, organization] = await Promise.all([
    can(me, 'platform.branch.view') ? api<Branch[]>('/branches') : [],
    api<OwnOrganization>('/organization'),
  ]);
  const branches = branchesForWork(me, allBranches, 'students.student.create');
  const back = { href: '/students', label: 'Back to students' };
  if (branches.length === 0) {
    return (
      <>
        <PageHeader back={back} title="Add student" />
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

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader back={back} title="Add student" />
      <ActionForm action={admitStudent} submitLabel="Add student" ownButtons>
        <AdmissionWizard
          branches={branches.map((b) => ({ id: b.id, name: b.name }))}
          picker={picker}
          years={years
            .filter((y) => y.status !== 'CLOSED')
            .map((y) => ({
              id: y.id,
              name: y.name,
              current: y.status === 'ACTIVE',
              today: y.startsOn.slice(0, 10) <= today && today <= y.endsOn.slice(0, 10),
            }))}
          manual={organization.admissionNumbering === 'MANUAL'}
          pattern={organization.admissionNoPattern}
        />
      </ActionForm>
    </>
  );
}
