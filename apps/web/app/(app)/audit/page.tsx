/**
 * /audit: who changed what in the organization, newest first.
 */
import { PageHeader, Table, TableHead, Td, Th } from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../../lib/api';
import type { AuditLog, Page } from '../../../lib/types';

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page = '1' } = await searchParams;
  const result = await api<Page<AuditLog>>(`/audit-logs?page=${Number(page) || 1}&pageSize=50`);
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <>
      <PageHeader title="Audit log" description="Every change to your organization's data" />
      <Table>
        <TableHead>
          <tr>
            <Th>When</Th>
            <Th>Who</Th>
            <Th>Action</Th>
            <Th>What</Th>
            <Th>Details</Th>
          </tr>
        </TableHead>
        <tbody>
          {result.items.map((log) => (
            <tr key={log.id}>
              <Td className="whitespace-nowrap text-muted-foreground">
                {new Date(log.createdAt).toLocaleString()}
              </Td>
              <Td className="text-xs">
                {log.actorType === 'super_admin' ? 'EduPlatform staff' : log.actorId}
              </Td>
              <Td>{log.action}</Td>
              <Td>{log.entity}</Td>
              <Td className="max-w-md truncate font-mono text-xs">
                {log.details ? JSON.stringify(log.details) : ''}
              </Td>
            </tr>
          ))}
          {result.items.length === 0 && (
            <tr>
              <Td colSpan={5} className="py-8 text-center text-muted-foreground">
                Nothing yet.
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
              href={`/audit?page=${n}`}
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
