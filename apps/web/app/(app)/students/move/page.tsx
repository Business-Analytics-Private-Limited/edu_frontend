/**
 * /students/move: shuffle — move students of one section to another section of the same campus,
 * in the same academic year.
 *   1. choose the year and the section (?academicYearId=&sectionId=);
 *   2. tick the students, choose the target section, move.
 * Needs "students.enrolment.transfer" at the campus. Roll numbers are cleared when moving.
 */
import {
  ActionForm,
  Button,
  Checkbox,
  EmptyState,
  Field,
  PageHeader,
  Select,
} from '@eduplatform/ui';
import { ArrowLeftRight } from 'lucide-react';
import { api } from '../../../../lib/api';
import { can, canAt, getMe } from '../../../../lib/me';
import { sectionOptions } from '../../../../lib/sections';
import type { AcademicYear, Institution, Page, StudentListItem } from '../../../../lib/types';
import { moveStudents } from '../actions';
import { campusesInUse } from '../../../../lib/places';

export default async function MoveStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ academicYearId?: string; sectionId?: string }>;
}) {
  const { academicYearId = '', sectionId = '' } = await searchParams;
  const me = await getMe();
  const [institutions, years] = await Promise.all([
    can(me, 'platform.institution.view') ? api<Institution[]>('/institutions') : [],
    can(me, 'academic.year.view') ? api<AcademicYear[]>('/academic-years') : [],
  ]);
  const campuses = institutions.flatMap((i) =>
    campusesInUse(i)
      .filter((c) =>
        canAt(me, 'students.enrolment.transfer', { institutionId: i.id, campusId: c.id }),
      )
      .map((c) => ({ ...c, institution: i })),
  );
  if (campuses.length === 0) {
    return (
      <>
        <PageHeader title="Move students" />
        <EmptyState
          icon={<ArrowLeftRight />}
          title="Nothing to move"
          description="Your roles don't allow moving students between sections at any campus."
        />
      </>
    );
  }
  const sections = can(me, 'academic.structure.view')
    ? await sectionOptions(campuses.map((c) => c.id))
    : [];
  const campusName = new Map(campuses.map((c) => [c.id, c.name]));
  const from = sections.find((s) => s.id === sectionId);
  const students =
    from && academicYearId
      ? await api<Page<StudentListItem>>(
          `/students?${new URLSearchParams({ classId: from.id, academicYearId, status: 'ACTIVE', pageSize: '100' })}`,
        )
      : null;
  const targets = from
    ? sections.filter((s) => s.campusId === from.campusId && s.id !== from.id)
    : [];

  return (
    <>
      <PageHeader
        title="Move students"
        description="Move students to another section of the same campus, in the same academic year."
      />

      <form className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Academic year" htmlFor="academicYearId">
          <Select
            id="academicYearId"
            name="academicYearId"
            defaultValue={academicYearId}
            required
            className="w-52"
          >
            {years
              .filter((y) => y.status !== 'CLOSED')
              .map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} ({y.institution.name})
                </option>
              ))}
          </Select>
        </Field>
        <Field label="From section" htmlFor="sectionId">
          <Select
            id="sectionId"
            name="sectionId"
            defaultValue={sectionId}
            required
            className="w-80"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {campusName.get(s.campusId)} · {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" variant="outline">
          Show students
        </Button>
      </form>

      {students && from && (
        <ActionForm
          action={moveStudents}
          submitLabel="Move ticked students"
          pendingLabel="Moving…"
          resetOnSuccess
          className="max-w-xl"
        >
          <input type="hidden" name="academicYearId" value={academicYearId} />
          <div className="flex flex-col gap-2 rounded-lg border p-4">
            {students.items.length === 0 && (
              <p className="text-sm text-muted-foreground">No active students in this section.</p>
            )}
            {students.items.map((s) => (
              <Checkbox
                key={s.id}
                name="studentIds"
                value={s.id}
                label={s.fullName}
                description={`${s.admissionNo}${s.enrolments[0]?.rollNo ? ` · #${s.enrolments[0].rollNo}` : ''}`}
              />
            ))}
          </div>
          <Field label="To section" htmlFor="toSectionId">
            <Select id="toSectionId" name="toSectionId" required>
              {targets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
        </ActionForm>
      )}
    </>
  );
}
