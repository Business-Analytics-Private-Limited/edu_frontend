/**
 * The filter bar of the Students list and the Top rankers page: a normal GET form, so the
 * filters end up in the URL. Search, branch, academic year, any part of the structure (e.g.
 * "Junior" or "Junior › MPC › JEE Mains", across every branch), and, once a branch is chosen,
 * one of its sections. Extra fields (e.g. the learner level) come in as children.
 *
 *   <StudentFilters filters={filters} hidden={{ show }} branches={branches} years={years}
 *                   structure={structure} sections={sections} />
 */
import { Button, Input, Select } from '@eduplatform/ui';
import type { ReactNode } from 'react';
import { classPaths } from '../lib/structure';
import type { AcademicYear, Branch, Section, Structure } from '../lib/types';

export interface StudentFilterValues {
  search?: string;
  branchId?: string;
  academicYearId?: string;
  /** A class above sections (year, group, stream …). */
  classId?: string;
  /** One section of the chosen branch (wins over classId). */
  sectionId?: string;
}

export function StudentFilters({
  filters,
  hidden = {},
  branches,
  years,
  structure,
  sections,
  children,
}: {
  filters: StudentFilterValues;
  /** Kept as they are when filtering, e.g. { show: 'current' }. */
  hidden?: Record<string, string>;
  branches: Branch[];
  years: AcademicYear[];
  structure: Structure | null;
  /** The chosen branch's sections (empty when no branch is chosen). */
  sections: Section[];
  children?: ReactNode;
}) {
  const classOptions = structure ? classPaths(structure.classes) : [];
  return (
    <form className="mb-4 flex flex-wrap gap-2">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Input
        name="search"
        defaultValue={filters.search}
        placeholder="Name, admission no or phone"
        className="w-full sm:max-w-xs"
      />
      {branches.length > 1 && (
        <Select name="branchId" defaultValue={filters.branchId ?? ''} className="w-full sm:w-44">
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      )}
      {years.length > 0 && (
        <Select
          name="academicYearId"
          defaultValue={filters.academicYearId ?? ''}
          className="w-full sm:w-36"
        >
          <option value="">Any year</option>
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
            </option>
          ))}
        </Select>
      )}
      {classOptions.length > 0 && (
        <Select name="classId" defaultValue={filters.classId ?? ''} className="w-full sm:w-72">
          <option value="">All {structure!.levels[0].toLowerCase()}s, groups and streams</option>
          {classOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      )}
      {sections.length > 0 && (
        <Select name="sectionId" defaultValue={filters.sectionId ?? ''} className="w-full sm:w-72">
          <option value="">Every section of the branch</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.path} › {s.name}
            </option>
          ))}
        </Select>
      )}
      {children}
      <Button type="submit" variant="outline">
        Filter
      </Button>
    </form>
  );
}

/** The API query for these filters: a section wins over a class (both are `classId`). */
export function filterQuery(filters: StudentFilterValues): URLSearchParams {
  const query = new URLSearchParams();
  for (const key of ['search', 'branchId', 'academicYearId'] as const) {
    if (filters[key]) query.set(key, filters[key]!);
  }
  const classId = filters.sectionId || filters.classId;
  if (classId) query.set('classId', classId);
  return query;
}
