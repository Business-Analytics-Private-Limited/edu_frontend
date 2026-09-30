/**
 * /audit: who changed what, where, and when; newest first.
 * Organization-wide admins see everything; a Principal / Campus admin sees only the changes in
 * their own institution / campus (the API filters it).
 */
import { PageHeader, Table, TableHead, Td, Th } from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../../lib/api';
import type { AuditLog, Institution, Page } from '../../../lib/types';

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page = '1' } = await searchParams;
  const [result, institutions] = await Promise.all([
    api<Page<AuditLog>>(`/audit-logs?page=${Number(page) || 1}&pageSize=50`),
    api<Institution[]>('/institutions').catch(() => [] as Institution[]),
  ]);

  // Names for the "Where" column, from the institutions and campuses the user may see.
  const names = new Map<string, string>();
  for (const institution of institutions) {
    names.set(institution.id, institution.name);
    for (const campus of institution.campuses) names.set(campus.id, campus.name);
  }
  const where = (log: AuditLog) => {
    if (log.campusId) return names.get(log.campusId) ?? 'A campus';
    if (log.institutionId) return names.get(log.institutionId) ?? 'An institution';
    return 'Whole organization';
  };
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <>
      <PageHeader title="Audit log" description="Every change to your organization's data" />
      <Table>
        <TableHead>
          <tr>
            <Th>When</Th>
            <Th>Who</Th>
            <Th>Where</Th>
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
              <Td>
                {log.actorType === 'super_admin'
                  ? `EduPlatform (${log.actorName ?? 'staff'})`
                  : (log.actorName ?? 'Unknown')}
              </Td>
              <Td className="text-muted-foreground">{where(log)}</Td>
              <Td>{log.action}</Td>
              <Td>{log.entity}</Td>
              <Td className="max-w-md truncate font-mono text-xs">
                {log.details ? JSON.stringify(log.details) : ''}
              </Td>
            </tr>
          ))}
          {result.items.length === 0 && (
            <tr>
              <Td colSpan={6} className="py-8 text-center text-muted-foreground">
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
