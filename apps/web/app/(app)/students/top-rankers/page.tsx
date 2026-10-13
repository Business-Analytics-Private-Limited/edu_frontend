/**
 * /students/top-rankers: current students marked as top rankers (ADR-0031), with tabs for the
 * learner level (All / Expert / Medium learner / Slow learner) and the usual filters: branch,
 * academic year, any part of the structure (e.g. Junior or Senior, a group, a stream) and a
 * section of the chosen branch. A student is marked on "Edit student" (Top ranker, Learner
 * level) or with the topRanker / learnerLevel columns of an import.
 */
import { Badge, PageHeader, Table, TableHead, Td, Th } from '@eduplatform/ui';
import Link from 'next/link';
import {
  filterQuery,
  StudentFilters,
  type StudentFilterValues,
} from '../../../../components/student-filters';
import { RowActions } from '../../../../components/student-row-actions';
import { api } from '../../../../lib/api';
import { can, canAt, getMe } from '../../../../lib/me';
import type {
  AcademicYear,
  Branch,
  BranchSections,
  LearnerLevel,
  Page,
  StudentListItem,
  Structure,
} from '../../../../lib/types';
import { LEARNER_LEVELS } from '../labels';

interface Filters extends StudentFilterValues {
  level?: string;
  page?: string;
}

const LEVEL_BADGE: Record<LearnerLevel, 'success' | 'default' | 'warning'> = {
  EXPERT: 'success',
  MEDIUM: 'default',
  SLOW: 'warning',
};

export default async function TopRankersPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = await searchParams;
  const level = (Object.keys(LEARNER_LEVELS) as LearnerLevel[]).find((l) => l === filters.level);
  const query = filterQuery(filters);
  query.set('topRanker', 'true');
  query.set('show', 'current');
  query.set('page', filters.page ?? '1');
  query.set('pageSize', '50');
  if (level) query.set('learnerLevel', level);

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
    `/students/top-rankers?${new URLSearchParams(
      Object.entries({ ...filters, ...change }).filter(([, v]) => v) as [string, string][],
    )}`;

  return (
    <>
      <PageHeader
        back={{ href: '/students', label: 'Back to students' }}
        title="Top rankers"
        description={`${result.total} top ranker(s)${level ? `: ${LEARNER_LEVELS[level]}` : ''}`}
      />

      <div className="mb-4 flex gap-1 border-b">
        {[undefined, ...(Object.keys(LEARNER_LEVELS) as LearnerLevel[])].map((tab) => (
          <Link
            key={tab ?? 'all'}
            href={link({ level: tab, page: '1' })}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${
              level === tab
                ? 'border-primary font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab ? LEARNER_LEVELS[tab] : 'All'}
          </Link>
        ))}
      </div>

      <StudentFilters
        filters={filters}
        hidden={level ? { level } : {}}
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
            <Th>Section</Th>
            <Th>Learner level</Th>
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
              </Td>
              <Td>{s.branch.name}</Td>
              <Td>
                {s.placement ? (
                  s.placement.section
                ) : (
                  <span className="text-muted-foreground">Not placed</span>
                )}
              </Td>
              <Td>
                {s.learnerLevel ? (
                  <Badge variant={LEVEL_BADGE[s.learnerLevel]}>
                    {LEARNER_LEVELS[s.learnerLevel]}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">Not set</span>
                )}
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
                No top rankers here. Mark a student on their Edit page (Top ranker).
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
