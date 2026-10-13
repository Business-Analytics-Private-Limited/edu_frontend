/**
 * /audit: the whole audit log of EduPlatform (ADR-0027), newest first. Every organization's
 * entries, plus the platform's own: super admin logins and changes, predefined roles, and failed
 * logins with emails that belong to nobody.
 *
 * Filters (a normal form that puts ?organizationId=…&action=… in the URL):
 *   organization   one organization, or "EduPlatform itself" for entries of no organization
 *   action         e.g. "login failed" to spot password guessing
 */
import { Badge, Button, PageHeader, Select, Table, TableHead, Td, Th } from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../../lib/api';
import type { OrganizationListItem, Page, PlatformAuditEntry } from '../../../lib/types';

/** The actions worth filtering by; the list shows every action anyway. */
const ACTIONS = [
  'login',
  'login failed',
  'change password',
  'create',
  'update',
  'delete',
  'deactivate',
  'activate',
  'suspend',
  'module_on',
  'module_off',
  'download document',
];

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string; action?: string; page?: string }>;
}) {
  const { organizationId = '', action = '', page = '1' } = await searchParams;
  const query = new URLSearchParams({ page, pageSize: '50' });
  if (organizationId) query.set('organizationId', organizationId);
  if (action) query.set('action', action);
  const [result, organizations] = await Promise.all([
    api<Page<PlatformAuditEntry>>(`/super-admin/audit-logs?${query}`),
    api<Page<OrganizationListItem>>('/super-admin/organizations?pageSize=100'),
  ]);
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const link = (n: number) =>
    `/audit?${new URLSearchParams({ organizationId, action, page: String(n) })}`;

  return (
    <>
      <PageHeader
        title="Audit log"
        description={`${result.total} entr${result.total === 1 ? 'y' : 'ies'}. Entries can't be changed or deleted.`}
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <Select name="organizationId" defaultValue={organizationId} className="w-full sm:w-64">
          <option value="">All organizations</option>
          <option value="platform">EduPlatform itself</option>
          {organizations.items.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </Select>
        <Select name="action" defaultValue={action} className="w-full sm:w-48">
          <option value="">All actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
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
            <Th>When</Th>
            <Th>Who</Th>
            <Th>Organization</Th>
            <Th>Action</Th>
            <Th>What</Th>
            <Th>Details</Th>
          </tr>
        </TableHead>
        <tbody>
          {result.items.map((entry) => (
            <tr key={entry.id}>
              <Td className="whitespace-nowrap text-muted-foreground">
                {new Date(entry.createdAt).toLocaleString()}
              </Td>
              <Td>
                {entry.actorType === 'super_admin'
                  ? `EduPlatform (${entry.actorName ?? 'staff'})`
                  : (entry.actorName ?? 'Unknown person')}
              </Td>
              <Td>{entry.organizationName ?? '—'}</Td>
              <Td>
                <Badge variant={entry.action === 'login failed' ? 'destructive' : 'outline'}>
                  {entry.action}
                </Badge>
              </Td>
              <Td>{entry.entity}</Td>
              <Td className="max-w-md truncate text-xs text-muted-foreground">
                {entry.details ? JSON.stringify(entry.details) : ''}
              </Td>
            </tr>
          ))}
          {result.items.length === 0 && (
            <tr>
              <Td colSpan={6} className="py-8 text-center text-muted-foreground">
                No entries.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>

      {pages > 1 && (
        <div className="mt-4 flex items-center gap-4 text-sm">
          {result.page > 1 && (
            <Link href={link(result.page - 1)} className="text-primary hover:underline">
              ← Newer
            </Link>
          )}
          <span className="text-muted-foreground">
            Page {result.page} of {pages}
          </span>
          {result.page < pages && (
            <Link href={link(result.page + 1)} className="text-primary hover:underline">
              Older →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
