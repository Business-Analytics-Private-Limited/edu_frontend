/**
 * /roles: the organization's roles (Organization admin, Teacher, Office staff, ...).
 * A role is a named list of permissions; every user has one role.
 */
import { Badge, Button, PageHeader, Table, TableHead, Td, Th } from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../../lib/api';
import type { Role } from '../../../lib/types';

export default async function RolesPage() {
  const roles = await api<Role[]>('/roles');

  return (
    <>
      <PageHeader
        title="Roles"
        description="What each kind of user may do"
        actions={
          <Button asChild>
            <Link href="/roles/new">New role</Link>
          </Button>
        }
      />
      <Table>
        <TableHead>
          <tr>
            <Th>Name</Th>
            <Th>Description</Th>
            <Th>Permissions</Th>
            <Th>Users</Th>
          </tr>
        </TableHead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id}>
              <Td>
                <Link
                  href={`/roles/${role.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {role.name}
                </Link>
                {role.isSystem && (
                  <Badge variant="outline" className="ml-2">
                    built-in
                  </Badge>
                )}
              </Td>
              <Td className="text-muted-foreground">{role.description ?? '—'}</Td>
              <Td>{role.permissions.length}</Td>
              <Td>{role._count?.users ?? 0}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
