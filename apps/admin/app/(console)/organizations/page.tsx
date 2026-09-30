/**
 * /organizations: every organization, with search and status filter.
 * The filter is a normal form: it puts ?search=…&status=… in the URL and the page reloads.
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
import type { OrganizationListItem, Page } from '../../../lib/types';

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const { search = '', status = '', page = '1' } = await searchParams;
  const query = new URLSearchParams({ page, pageSize: '20' });
  if (search) query.set('search', search);
  if (status) query.set('status', status);
  const result = await api<Page<OrganizationListItem>>(`/super-admin/organizations?${query}`);
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <>
      <PageHeader
        title="Organizations"
        description={`${result.total} organization(s)`}
        actions={
          <Button asChild>
            <Link href="/organizations/new">New organization</Link>
          </Button>
        }
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <Input
          name="search"
          defaultValue={search}
          placeholder="Search name or slug"
          className="max-w-xs"
        />
        <Select name="status" defaultValue={status} className="w-40">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </Select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <Table>
        <TableHead>
          <tr>
            <Th>Name</Th>
            <Th>Slug</Th>
            <Th>Institutions</Th>
            <Th>Users</Th>
            <Th>Status</Th>
          </tr>
        </TableHead>
        <tbody>
          {result.items.map((org) => (
            <tr key={org.id}>
              <Td>
                <Link
                  href={`/organizations/${org.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {org.name}
                </Link>
              </Td>
              <Td className="text-muted-foreground">{org.slug}</Td>
              <Td>{org._count.institutions}</Td>
              <Td>{org._count.users}</Td>
              <Td>
                <Badge variant={org.status === 'ACTIVE' ? 'success' : 'destructive'}>
                  {org.status}
                </Badge>
              </Td>
            </tr>
          ))}
          {result.items.length === 0 && (
            <tr>
              <Td colSpan={5} className="py-8 text-center text-muted-foreground">
                No organizations found.
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
              href={`/organizations?${new URLSearchParams({ search, status, page: String(n) })}`}
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
