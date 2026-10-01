/**
 * /students: the students you may see (your campus, institution or the whole organization),
 * with search and filters. The filter is a normal form: it puts ?search=…&campusId=… in the URL.
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
import type { Institution, Page, StudentListItem } from '../../../lib/types';
import { sectionLabel, STUDENT_STATUSES } from './labels';

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; campusId?: string; status?: string; page?: string }>;
}) {
  const { search = '', campusId = '', status = 'ACTIVE', page = '1' } = await searchParams;
  const query = new URLSearchParams({ page, pageSize: '25' });
  if (search) query.set('search', search);
  if (campusId) query.set('campusId', campusId);
  if (status) query.set('status', status);

  const me = await getMe();
  const [result, institutions] = await Promise.all([
    api<Page<StudentListItem>>(`/students?${query}`),
    can(me, 'platform.institution.view') ? api<Institution[]>('/institutions') : [],
  ]);
  const campuses = institutions.flatMap((i) => i.campuses.map((c) => ({ ...c, institution: i })));
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <>
      <PageHeader
        title="Students"
        description={`${result.total} student(s)`}
        actions={
          can(me, 'students.student.create') && (
            <Button asChild>
              <Link href="/students/new">Admit student</Link>
            </Button>
          )
        }
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <Input
          name="search"
          defaultValue={search}
          placeholder="Name, admission no or phone"
          className="max-w-xs"
        />
        {campuses.length > 1 && (
          <Select name="campusId" defaultValue={campusId} className="w-48">
            <option value="">All campuses</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.institution.code})
              </option>
            ))}
          </Select>
        )}
        <Select name="status" defaultValue={status} className="w-40">
          <option value="">All statuses</option>
          {Object.entries(STUDENT_STATUSES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <Table>
        <TableHead>
          <tr>
            <Th>Adm. no</Th>
            <Th>Name</Th>
            <Th>Campus</Th>
            <Th>Section</Th>
            <Th>Batch</Th>
            <Th>Status</Th>
          </tr>
        </TableHead>
        <tbody>
          {result.items.map((s) => {
            const current = s.enrolments[0];
            return (
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
                <Td>{s.campus.name}</Td>
                <Td>
                  {current ? (
                    <>
                      {sectionLabel(current.class)}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {current.academicYear.name}
                        {current.rollNo ? ` · #${current.rollNo}` : ''}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </Td>
                <Td>{s.batch ? `${s.batch.name} (${s.batch.stage})` : '—'}</Td>
                <Td>
                  <Badge variant={s.status === 'ACTIVE' ? 'success' : 'outline'}>
                    {STUDENT_STATUSES[s.status]}
                  </Badge>
                </Td>
              </tr>
            );
          })}
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
              href={`/students?${new URLSearchParams({ search, campusId, status, page: String(n) })}`}
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
