/**
 * /evaluation/new: create an exam (backend ADR-0035), in two steps.
 *   1. WHERE (a small GET form, so the page reloads with ?branchId=&classId=): one branch or
 *      every branch, and the part of the structure it is for: a year (all its sections), a
 *      group, a stream, or one section.
 *   2. The exam: type, academic year, name (unique in the year), dates inside the year, and the
 *      subjects, each with maximum and pass marks, an optional date and an optional portion
 *      ("Ch 1-4") with the syllabus chapters it covers ticked (ADR-0037), and the grades to use
 *      (the default grading scheme unless another is chosen). The subjects offered are those attached to the chosen part (Academic →
 *      subjects of a class), ticked; the organization's other subjects are folded away below.
 * Every active section under the chosen part takes part, and each section is expected to have
 * marks only in its own subjects.
 */
import {
  ActionForm,
  Button,
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
import { AutoSubmitForm } from '../../../../components/auto-submit-form';
import { api } from '../../../../lib/api';
import { can, canAt, getMe } from '../../../../lib/me';
import { branchesForWork } from '../../../../lib/places';
import { classPaths } from '../../../../lib/structure';
import type {
  AcademicYear,
  Branch,
  BranchSections,
  ExamSubjectOptions,
  ExamType,
  GradingScheme,
  Structure,
  SubjectListItem,
} from '../../../../lib/types';
import { startingYearId } from '../../../../lib/years';
import { createExam } from '../actions';

export default async function NewExamPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string; classId?: string }>;
}) {
  const params = await searchParams;
  const me = await getMe();
  const back = { href: '/evaluation', label: 'Back to exams' };
  const [types, years, allBranches, structure, subjects, schemes] = await Promise.all([
    api<ExamType[]>('/exam-types'),
    api<AcademicYear[]>('/academic-years'),
    can(me, 'platform.branch.view') ? api<Branch[]>('/branches') : [],
    api<Structure>('/academic-structure'),
    api<SubjectListItem[]>('/subjects'),
    api<GradingScheme[]>('/grading-schemes'),
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
  const branchId = params.branchId ?? (everyBranch ? '' : (branches[0]?.id ?? ''));
  // An exam for one section is held at that section's branch, whatever the Branch list says.
  const sectionBranch = perBranch.find((b) =>
    b.sections.some((s) => s.id === params.classId),
  )?.branch;
  const examBranchId = sectionBranch?.id ?? branchId;
  const branchName = sectionBranch?.name ?? branches.find((b) => b.id === branchId)?.name;
  // Step 2 appears once "For" is chosen.
  const options = params.classId
    ? await api<ExamSubjectOptions>(
        `/exams/subject-options?${new URLSearchParams({
          classId: params.classId,
          ...(examBranchId && { branchId: examBranchId }),
        })}`,
      )
    : null;

  return (
    <>
      <PageHeader
        back={back}
        title="New exam"
        description="First choose where the exam is held, then its details and subjects. Every active section under that part takes part."
      />
      <AutoSubmitForm className="mb-6 grid max-w-4xl gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-2">
        <h2 className="text-base font-semibold sm:col-span-2">1. Where the exam is held</h2>
        <Field label="Branch *" htmlFor="branchId" hint="Every branch, or one branch">
          <Select id="branchId" name="branchId" defaultValue={branchId}>
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
          <Select id="classId" name="classId" required defaultValue={params.classId ?? ''}>
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
        <div className="sm:col-span-2">
          <Button type="submit" variant="outline">
            Show its subjects
          </Button>
        </div>
      </AutoSubmitForm>

      {options && (
        <ActionForm action={createExam} submitLabel="Create exam" className="max-w-4xl gap-6">
          <input type="hidden" name="branchId" value={examBranchId} />
          <input type="hidden" name="classId" value={options.appliesTo.classId} />
          <div>
            <h2 className="text-base font-semibold">2. The exam</h2>
            <p className="text-sm text-muted-foreground">
              For {options.appliesTo.label}
              {branchName ? ` at ${branchName}` : ''}: {options.sections} active section(s) take
              part.
            </p>
          </div>
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
              label="Grades"
              htmlFor="gradingSchemeId"
              hint="Evaluation → Grades. Can be changed later."
              className="sm:col-span-2"
            >
              <Select id="gradingSchemeId" name="gradingSchemeId" defaultValue="">
                <option value="">
                  {schemes.some((g) => g.isDefault)
                    ? `The default (${schemes.find((g) => g.isDefault)?.name})`
                    : 'No grades (marks and percentages only)'}
                </option>
                {schemes
                  .filter((g) => !g.isDefault)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
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
            <Field label="Starts on *" htmlFor="startsOn">
              <Input id="startsOn" name="startsOn" type="date" required />
            </Field>
            <Field label="Ends on *" htmlFor="endsOn">
              <Input id="endsOn" name="endsOn" type="date" required />
            </Field>
          </div>

          <div className="grid gap-2">
            <h3 className="text-base font-semibold">Subjects and marks</h3>
            {options.subjects.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                The subjects of {options.appliesTo.label}, all ticked: untick those not in this
                exam. Each section is expected to have marks only in its own subjects. Portion: what
                the exam covers, for example &quot;Ch 1-4, Trigonometry&quot;; tick the syllabus
                chapters it covers under Chapters.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No subjects are attached to {options.appliesTo.label} yet (Academic → Academic
                structure → a class → Subjects), so all subjects are shown. Ticked subjects are for
                every section.
              </p>
            )}
            {options.subjects.length > 0 && options.sectionsWithoutSubjects > 0 && (
              <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                {options.sectionsWithoutSubjects} of {options.sections} section(s) have no subjects
                attached yet, so they take every ticked subject. Attach subjects in Academic →
                Academic structure to change that.
              </p>
            )}
            {options.subjects.length > 0 && (
              <SubjectTable
                rows={options.subjects.map((s) => ({
                  ...s,
                  ticked: true,
                  where:
                    s.sections < options.sections
                      ? `${s.sections} of ${options.sections} sections: ${s.attachedTo.join(', ')}`
                      : undefined,
                }))}
              />
            )}
            {options.otherSubjects.length > 0 &&
              (options.subjects.length > 0 ? (
                <details className="rounded-xl border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Other subjects ({options.otherSubjects.length}): not attached to this class; if
                    ticked, for every section
                  </summary>
                  <div className="mt-3">
                    <SubjectTable
                      rows={options.otherSubjects.map((s) => ({ ...s, ticked: false }))}
                    />
                  </div>
                </details>
              ) : (
                <SubjectTable rows={options.otherSubjects.map((s) => ({ ...s, ticked: false }))} />
              ))}
          </div>
        </ActionForm>
      )}
    </>
  );
}

/** The subject rows of the form: tick box, maximum, pass marks, date, portion and chapters. */
function SubjectTable({
  rows,
}: {
  rows: {
    id: string;
    code: string;
    name: string;
    ticked: boolean;
    where?: string;
    chapters: { id: string; name: string }[];
  }[];
}) {
  return (
    <Table>
      <TableHead>
        <tr>
          <Th>Subject</Th>
          <Th>Maximum</Th>
          <Th>Pass</Th>
          <Th>Date (optional)</Th>
          <Th>Portion (optional)</Th>
          <Th>Chapters (optional)</Th>
        </tr>
      </TableHead>
      <tbody>
        {rows.map((s) => (
          <tr key={s.id}>
            <Td>
              <Checkbox
                name="subject"
                value={s.id}
                defaultChecked={s.ticked}
                label={`${s.name} (${s.code})`}
                description={s.where}
              />
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
            <Td>
              <Input
                name={`portion_${s.id}`}
                maxLength={300}
                placeholder="Ch 1-4"
                aria-label={`${s.name}: portion`}
                className="w-48"
              />
            </Td>
            <Td>
              {s.chapters.length === 0 ? (
                <span className="text-xs text-muted-foreground">No syllabus yet</span>
              ) : (
                <details>
                  <summary className="cursor-pointer text-sm">
                    {s.chapters.length} chapter(s)
                  </summary>
                  <div className="mt-2 grid gap-1">
                    {s.chapters.map((c) => (
                      <Checkbox key={c.id} name={`chapter_${s.id}`} value={c.id} label={c.name} />
                    ))}
                  </div>
                </details>
              )}
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
