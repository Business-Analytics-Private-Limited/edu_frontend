/**
 * /evaluation/new: create an exam (backend ADR-0035).
 *   - type, academic year, name (unique in the year), dates inside the year;
 *   - WHERE: one branch, or every branch; and the part of the structure it is for: a year (all
 *     its sections), a group, a stream, or one section;
 *   - the subjects, each with maximum and pass marks (and an optional date).
 * Every active section under the chosen part (at the branch, or at all) takes part; their
 * students are those placed there during the exam.
 */
import {
  ActionForm,
  Checkbox,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { FileSpreadsheet } from 'lucide-react';
import { api } from '../../../../lib/api';
import { can, canAt, getMe } from '../../../../lib/me';
import { branchesForWork } from '../../../../lib/places';
import { classPaths } from '../../../../lib/structure';
import type {
  AcademicYear,
  Branch,
  BranchSections,
  ExamType,
  Structure,
  SubjectListItem,
} from '../../../../lib/types';
import { startingYearId } from '../../../../lib/years';
import { createExam } from '../actions';

export default async function NewExamPage() {
  const me = await getMe();
  const back = { href: '/evaluation', label: 'Back to exams' };
  const [types, years, allBranches, structure, subjects] = await Promise.all([
    api<ExamType[]>('/exam-types'),
    api<AcademicYear[]>('/academic-years'),
    can(me, 'platform.branch.view') ? api<Branch[]>('/branches') : [],
    api<Structure>('/academic-structure'),
    api<SubjectListItem[]>('/subjects'),
  ]);
  const branches = branchesForWork(me, allBranches, 'evaluation.exam.create');
  const everyBranch = canAt(me, 'evaluation.exam.create', {});
  const activeTypes = types.filter((t) => t.isActive);
  const activeSubjects = subjects.filter((s) => s.isActive);
  const openYears = years.filter((y) => y.status !== 'CLOSED');

  if (activeTypes.length === 0 || activeSubjects.length === 0 || openYears.length === 0) {
    return (
      <>
        <PageHeader back={back} title="New exam" />
        <EmptyState
          icon={<FileSpreadsheet />}
          title="Something is missing first"
          description={[
            activeTypes.length === 0 && 'Add an exam type (Evaluation → Exam types).',
            activeSubjects.length === 0 && 'Add subjects (Academic → Subjects).',
            openYears.length === 0 && 'Add an academic year (Academic → Academic years).',
          ]
            .filter(Boolean)
            .join(' ')}
        />
      </>
    );
  }

  const perBranch = await Promise.all(
    branches.map((b) => api<BranchSections>(`/branches/${b.id}/sections`)),
  );
  const parts = classPaths(structure.classes);

  return (
    <>
      <PageHeader
        back={back}
        title="New exam"
        description="Choose where the exam applies and its subjects. Every active section under that part takes part."
      />
      <ActionForm action={createExam} submitLabel="Create exam" className="max-w-4xl gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Exam type *" htmlFor="examTypeId">
            <Select id="examTypeId" name="examTypeId" required>
              {activeTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Academic year *" htmlFor="academicYearId">
            <Select
              id="academicYearId"
              name="academicYearId"
              required
              defaultValue={startingYearId(openYears) ?? ''}
            >
              {openYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                  {y.status === 'ACTIVE' ? ' · current' : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Exam name *"
            htmlFor="examName"
            hint="Unique in the academic year"
            className="sm:col-span-2"
          >
            <Input
              id="examName"
              name="name"
              required
              maxLength={150}
              placeholder="Quarterly exam, December 2026"
            />
          </Field>
          <Field label="Branch *" htmlFor="branchId" hint="Every branch, or one branch">
            <Select id="branchId" name="branchId" defaultValue={everyBranch ? '' : branches[0]?.id}>
              {everyBranch && <option value="">Every branch</option>}
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="For *"
            htmlFor="classId"
            hint="A year, group or stream: all its sections. Or one section (its branch is used)."
          >
            <Select id="classId" name="classId" required defaultValue="">
              <option value="" disabled>
                Choose…
              </option>
              <optgroup label="Part of the structure">
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
              {perBranch.map((b) => (
                <optgroup key={b.branch.id} label={`One section at ${b.branch.name}`}>
                  {b.sections
                    .filter((s) => s.isActive)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.path} › {s.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </Select>
          </Field>
          <Field label="Starts on *" htmlFor="startsOn">
            <Input id="startsOn" name="startsOn" type="date" required />
          </Field>
          <Field label="Ends on *" htmlFor="endsOn">
            <Input id="endsOn" name="endsOn" type="date" required />
          </Field>
        </div>

        <div className="grid gap-2">
          <h2 className="text-base font-semibold">Subjects and marks</h2>
          <p className="text-sm text-muted-foreground">
            Tick the subjects of this exam and give their maximum and pass marks.
          </p>
          <Table>
            <TableHead>
              <tr>
                <Th>Subject</Th>
                <Th>Maximum marks</Th>
                <Th>Pass marks</Th>
                <Th>Date (optional)</Th>
              </tr>
            </TableHead>
            <tbody>
              {activeSubjects.map((s) => (
                <tr key={s.id}>
                  <Td>
                    <Checkbox name="subject" value={s.id} label={`${s.name} (${s.code})`} />
                  </Td>
                  <Td>
                    <Input
                      name={`max_${s.id}`}
                      type="number"
                      min={1}
                      max={1000}
                      step="0.01"
                      defaultValue={100}
                      aria-label={`${s.name}: maximum marks`}
                      className="w-24"
                    />
                  </Td>
                  <Td>
                    <Input
                      name={`pass_${s.id}`}
                      type="number"
                      min={0}
                      max={1000}
                      step="0.01"
                      defaultValue={35}
                      aria-label={`${s.name}: pass marks`}
                      className="w-24"
                    />
                  </Td>
                  <Td>
                    <Input
                      name={`date_${s.id}`}
                      type="date"
                      aria-label={`${s.name}: date`}
                      className="w-40"
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </ActionForm>
    </>
  );
}
