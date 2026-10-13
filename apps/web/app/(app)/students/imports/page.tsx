/**
 * /students/imports: the import history (ADR-0031). Every "Import students" makes a record,
 * IMP-0001, IMP-0002 …: when, who, where (branch › section, year), the file name, and how many
 * rows were in the sheet, imported and excluded. Open one for the excluded rows and their
 * reasons, and the students it admitted. Only imports at branches where you may import.
 */
import { Badge, PageHeader, Table, TableHead, Td, Th } from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import type { ImportRun, Page } from '../../../../lib/types';

export default async function ImportHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page = '1' } = await searchParams;
  const result = await api<Page<ImportRun>>(`/students/imports?page=${page}&pageSize=25`);
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <>
      <PageHeader
        back={{ href: '/students/import', label: 'Back to import' }}
        title="Import history"
        description={`${result.total} import(s). The sheets themselves are not kept; each record keeps the counts and the excluded rows.`}
      />
      <Table>
        <TableHead>
          <tr>
            <Th>Import</Th>
            <Th>When</Th>
            <Th>Where</Th>
            <Th>By</Th>
            <Th className="text-right">Rows</Th>
            <Th className="text-right">Imported</Th>
            <Th className="text-right">Excluded</Th>
          </tr>
        </TableHead>
        <tbody>
          {result.items.map((run) => (
            <tr key={run.id}>
              <Td>
                <Link
                  href={`/students/imports/${run.id}`}
                  className="font-mono font-medium text-primary hover:underline"
                >
                  {run.code}
                </Link>
                {run.fileName && (
                  <span className="block text-xs text-muted-foreground">{run.fileName}</span>
                )}
              </Td>
              <Td>{new Date(run.createdAt).toLocaleString()}</Td>
              <Td>
                {run.branchName} › {run.section}
                <span className="block text-xs text-muted-foreground">{run.academicYearName}</span>
              </Td>
              <Td>{run.importedByName ?? '—'}</Td>
              <Td className="text-right">{run.totalRows}</Td>
              <Td className="text-right">
                <Badge variant="success">{run.importedCount}</Badge>
              </Td>
              <Td className="text-right">
                <Badge variant={run.excludedCount ? 'warning' : 'outline'}>
                  {run.excludedCount}
                </Badge>
              </Td>
            </tr>
          ))}
          {result.items.length === 0 && (
            <tr>
              <Td colSpan={7} className="py-8 text-center text-muted-foreground">
                No imports yet.
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
              href={`/students/imports?page=${n}`}
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
