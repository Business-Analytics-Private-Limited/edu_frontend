/**
 * /students: the students you may see (your branches, or the whole organization), in two tabs:
 *   Current    studying now (ACTIVE)
 *   Outgoing   left the organization: transferred, discontinued or completed (ADR-0030); kept in
 *              full, never deleted
 * Filters (a normal GET form, so they end up in the URL): search, branch, academic year, and any
 * part of the structure, e.g. "Junior › MPC › JEE Mains" across every branch (the Director's view).
 */
import {
  Badge,
  Button,
  Input,
  PageHeader,
  Select,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { can, getMe } from '../../../lib/me';
import type {
  AcademicYear,
  Branch,
  ClassItem,
  Page,
  StudentListItem,
  Structure,
} from '../../../lib/types';
import { STUDENT_STATUSES } from './labels';

interface Filters {
  search?: string;
  branchId?: string;
  classId?: string;
  academicYearId?: string;
  show?: string;
  page?: string;
}

export default async function StudentsPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = await searchParams;
  const show = filters.show === 'outgoing' ? 'outgoing' : 'current';
  const query = new URLSearchParams({ page: filters.page ?? '1', pageSize: '25', show });
  for (const key of ['search', 'branchId', 'classId', 'academicYearId'] as const) {
    if (filters[key]) query.set(key, filters[key]!);
  }

  const me = await getMe();
  const [result, branches, years, structure] = await Promise.all([
    api<Page<StudentListItem>>(`/students?${query}`),
    can(me, 'platform.branch.view') ? api<Branch[]>('/branches') : [],
    can(me, 'academic.year.view') ? api<AcademicYear[]>('/academic-years') : [],
    can(me, 'academic.structure.view') ? api<Structure>('/academic-structure') : null,
  ]);
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const link = (change: Partial<Filters>) =>
    `/students?${new URLSearchParams(
      Object.entries({ ...filters, ...change }).filter(([, v]) => v) as [string, string][],
    )}`;

  // Every class of the structure, as "Junior › MPC › JEE Mains", to filter by any part of it.
  const classOptions = structure ? labelled(structure.classes) : [];

  return (
    <>
      <PageHeader
        title="Students"
        description={`${result.total} ${show} student(s)`}
        actions={
          can(me, 'students.student.create') && (
            <Button asChild>
              <Link href="/students/new">Admit student</Link>
            </Button>
          )
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

      <form className="mb-4 flex flex-wrap gap-2">
        <input type="hidden" name="show" value={show} />
        <Input
          name="search"
          defaultValue={filters.search}
          placeholder="Name, admission no or phone"
          className="max-w-xs"
        />
        {branches.length > 1 && (
          <Select name="branchId" defaultValue={filters.branchId ?? ''} className="w-44">
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
            className="w-36"
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
          <Select name="classId" defaultValue={filters.classId ?? ''} className="w-72">
            <option value="">All {structure!.levels[0].toLowerCase()}s, groups and streams</option>
            {classOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        )}
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <Table>
        <TableHead>
          <tr>
            <Th>Adm. no</Th>
            <Th>Name</Th>
            <Th>Branch</Th>
            <Th>{show === 'current' ? 'Section' : 'Last section'}</Th>
            <Th>Status</Th>
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
            </tr>
          ))}
          {result.items.length === 0 && (
            <tr>
              <Td colSpan={5} className="py-8 text-center text-muted-foreground">
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

/** Every class with its path ("Junior › MPC › JEE Mains"), in tree order. */
function labelled(classes: ClassItem[]): { id: string; label: string }[] {
  const byOrder = (a: ClassItem, b: ClassItem) =>
    a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
  const out: { id: string; label: string }[] = [];
  const walk = (parentId: string | null, prefix: string) => {
    for (const c of classes.filter((x) => x.parentId === parentId).sort(byOrder)) {
      const label = prefix ? `${prefix} › ${c.name}` : c.name;
      out.push({ id: c.id, label });
      walk(c.id, label);
    }
  };
  walk(null, '');
  return out;
}
