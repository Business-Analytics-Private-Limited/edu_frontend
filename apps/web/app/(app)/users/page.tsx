/**
 * /users: the organization's users, with search and status filter.
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
import { can, getMe } from '../../../lib/me';
import type { Page, User } from '../../../lib/types';
import { placeLabel } from './place';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const { search = '', status = '', page = '1' } = await searchParams;
  const query = new URLSearchParams({ page, pageSize: '20' });
  if (search) query.set('search', search);
  if (status) query.set('status', status);
  const [me, result] = await Promise.all([getMe(), api<Page<User>>(`/users?${query}`)]);
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <>
      <PageHeader
        title="Users"
        description={`${result.total} user(s)`}
        actions={
          can(me, 'access.user.create') && (
            <Button asChild>
              <Link href="/users/new">Add user</Link>
            </Button>
          )
        }
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <Input
          name="search"
          defaultValue={search}
          placeholder="Search name or email"
          className="max-w-xs"
        />
        <Select name="status" defaultValue={status} className="w-40">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <Table>
        <TableHead>
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Roles</Th>
            <Th>Status</Th>
            <Th>Last login</Th>
          </tr>
        </TableHead>
        <tbody>
          {result.items.map((user) => (
            <tr key={user.id}>
              <Td>
                <Link
                  href={`/users/${user.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {user.name}
                </Link>
              </Td>
              <Td>{user.email}</Td>
              <Td>{user.roles.map((r) => `${r.role.name} · ${placeLabel(r)}`).join(', ')}</Td>
              <Td>
                <Badge variant={user.status === 'ACTIVE' ? 'success' : 'outline'}>
                  {user.status}
                </Badge>
              </Td>
              <Td className="text-muted-foreground">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
              </Td>
            </tr>
          ))}
          {result.items.length === 0 && (
            <tr>
              <Td colSpan={5} className="py-8 text-center text-muted-foreground">
                No users found.
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
              href={`/users?${new URLSearchParams({ search, status, page: String(n) })}`}
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
