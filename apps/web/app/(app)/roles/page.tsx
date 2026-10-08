/**
 * /roles: the organization's roles. A role is a named list of permissions; a user can have
 * several roles.
 *
 * Predefined roles (Director, Principal, ...) come from EduPlatform; the organization may change
 * their permissions ("customized", ADR-0029). The organization adds its own roles for anything
 * else.
 */
import { Badge, Button, PageHeader, Table, TableHead, Td, Th } from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { canAt, getMe } from '../../../lib/me';
import type { Role } from '../../../lib/types';

export default async function RolesPage() {
  const [me, roles] = await Promise.all([getMe(), api<Role[]>('/roles')]);

  return (
    <>
      <PageHeader
        title="Roles"
        description="What each kind of user may do. A user can have several roles."
        actions={
          canAt(me, 'access.role.create', {}) && (
            <Button asChild>
              <Link href="/roles/new">New role</Link>
            </Button>
          )
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
                {role.predefined ? (
                  <Badge variant="outline" className="ml-2">
                    predefined
                  </Badge>
                ) : (
                  <Badge className="ml-2">own</Badge>
                )}
                {role.customized && (
                  <Badge variant="warning" className="ml-1">
                    customized
                  </Badge>
                )}
              </Td>
              <Td className="text-muted-foreground">{role.description ?? '—'}</Td>
              <Td>{role.permissions.length}</Td>
              <Td>{role.assignable ? role._count.users : 'From student records'}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
