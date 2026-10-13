/**
 * /students: the students you may see (your branches, or the whole organization), in two tabs:
 *   Current    studying now (ACTIVE)
 *   Outgoing   left the organization: transferred, discontinued or completed (ADR-0030); kept in
 *              full, never deleted
 * Filters (a normal GET form, so they end up in the URL): search, branch, academic year, any part
 * of the structure (e.g. "Junior › MPC › JEE Mains" across every branch, the Director's view), and
 * a section of the chosen branch.
 * At the top: "Add student" (one student, a form) and "Import students" (a sheet). On each row:
 * view (eye) and edit (pencil, only where you may edit students) (ADR-0031).
 */
import { Badge, Button, PageHeader, Table, TableHead, Td, Th } from '@eduplatform/ui';
import { Star, Upload, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { RowActions } from '../../../components/student-row-actions';
import {
  filterQuery,
  StudentFilters,
  type StudentFilterValues,
} from '../../../components/student-filters';
import { api } from '../../../lib/api';
import { can, canAt, getMe } from '../../../lib/me';
import type {
  AcademicYear,
  Branch,
  BranchSections,
  Page,
  StudentListItem,
  Structure,
} from '../../../lib/types';
import { STUDENT_STATUSES } from './labels';

interface Filters extends StudentFilterValues {
  show?: string;
  page?: string;
}

export default async function StudentsPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = await searchParams;
  const show = filters.show === 'outgoing' ? 'outgoing' : 'current';
  const query = filterQuery(filters);
  query.set('page', filters.page ?? '1');
  query.set('pageSize', '25');
  query.set('show', show);

  const me = await getMe();
  const [result, branches, years, structure, branchSections] = await Promise.all([
    api<Page<StudentListItem>>(`/students?${query}`),
    can(me, 'platform.branch.view') ? api<Branch[]>('/branches') : [],
    can(me, 'academic.year.view') ? api<AcademicYear[]>('/academic-years') : [],
    can(me, 'academic.structure.view') ? api<Structure>('/academic-structure') : null,
    filters.branchId && can(me, 'academic.structure.view')
      ? api<BranchSections>(`/branches/${filters.branchId}/sections`)
      : null,
  ]);
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const link = (change: Partial<Filters>) =>
    `/students?${new URLSearchParams(
      Object.entries({ ...filters, ...change }).filter(([, v]) => v) as [string, string][],
    )}`;

  return (
    <>
      <PageHeader
        title="Students"
        description={`${result.total} ${show} student(s)`}
        actions={
          <div className="flex flex-wrap gap-2">
            {can(me, 'students.student.import') && (
              <Button asChild variant="outline">
                <Link href="/students/import">
                  <Upload /> Import students
                </Link>
              </Button>
            )}
            {can(me, 'students.student.create') && (
              <Button asChild>
                <Link href="/students/new">
                  <UserPlus /> Add student
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-4 flex gap-1 border-b">
        {(['current', 'outgoing'] as const).map((tab) => (
          <Link
            key={tab}
            href={link({ show: tab, page: '1' })}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${
              show === tab
                ? 'border-primary font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'current' ? 'Current' : 'Outgoing'}
          </Link>
        ))}
      </div>

      <StudentFilters
        filters={filters}
        hidden={{ show }}
        branches={branches}
        years={years}
        structure={structure}
        sections={branchSections?.sections ?? []}
      />

      <Table>
        <TableHead>
          <tr>
            <Th>Adm. no</Th>
            <Th>Name</Th>
            <Th>Branch</Th>
            <Th>{show === 'current' ? 'Section' : 'Last section'}</Th>
            <Th>Status</Th>
            <Th className="w-20 text-right">Actions</Th>
          </tr>
        </TableHead>
        <tbody>
          {result.items.map((s) => (
            <tr key={s.id}>
              <Td className="font-mono text-xs">{s.admissionNo}</Td>
              <Td>
                <Link
                  href={`/students/${s.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {s.fullName}
                  {s.surname ? ` ${s.surname}` : ''}
                </Link>
                {s.topRanker && (
                  <Star
                    className="ml-1 inline size-3.5 fill-amber-400 text-amber-500"
                    aria-label="Top ranker"
                  />
                )}
              </Td>
              <Td>{s.branch.name}</Td>
              <Td>
                {s.placement ? (
                  <>
                    {s.placement.section}
                    <span className="ml-1 text-xs text-muted-foreground">
                      {s.placement.academicYear.name}
                      {s.placement.rollNo ? ` · #${s.placement.rollNo}` : ''}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Not placed</span>
                )}
              </Td>
              <Td>
                <Badge variant={s.status === 'ACTIVE' ? 'success' : 'outline'}>
                  {STUDENT_STATUSES[s.status]}
                </Badge>
              </Td>
              <Td className="text-right">
                <RowActions
                  id={s.id}
                  canEdit={canAt(me, 'students.student.update', { branchId: s.branch.id })}
                />
              </Td>
            </tr>
          ))}
          {result.items.length === 0 && (
            <tr>
              <Td colSpan={6} className="py-8 text-center text-muted-foreground">
                No students found.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>

      {pages > 1 && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={link({ page: String(n) })}
              className={n === result.page ? 'font-semibold' : 'text-primary hover:underline'}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
