/**
 * /roles: the organization's roles. A role is a named list of permissions; a user can have
 * several roles.
 *
 * Predefined roles (Director, Principal, ...) are the same in every organization and only
 * EduPlatform can change them. The organization adds its own roles for anything else.
 */
import { Badge, Button, PageHeader, Table, TableHead, Td, Th } from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { can, getMe } from '../../../lib/me';
import type { Role } from '../../../lib/types';

export default async function RolesPage() {
  const [me, roles] = await Promise.all([getMe(), api<Role[]>('/roles')]);

  return (
    <>
      <PageHeader
        title="Roles"
        description="What each kind of user may do. A user can have several roles."
        actions={
          can(me, 'access.role.create') && (
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
