/**
 * /predefined-roles: the roles every organization has (Organization admin, Director, ...).
 * Only the super admin changes their permissions; a change applies to all organizations.
 * Organizations can't change them, but they can add their own roles.
 */
import { Badge, PageHeader, Table, TableHead, Td, Th } from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../../lib/api';
import type { PredefinedRole } from '../../../lib/types';

export default async function PredefinedRolesPage() {
  const roles = await api<PredefinedRole[]>('/super-admin/predefined-roles');

  return (
    <>
      <PageHeader
        title="Predefined roles"
        description="Every organization has these roles. Changes apply to all organizations at once."
      />
      <Table>
        <TableHead>
          <tr>
            <Th>Role</Th>
            <Th>Description</Th>
            <Th>Permissions</Th>
            <Th>Given</Th>
          </tr>
        </TableHead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.key}>
              <Td>
                <Link
                  href={`/predefined-roles/${role.key}`}
                  className="font-medium text-primary hover:underline"
                >
                  {role.name}
                </Link>
              </Td>
              <Td className="text-muted-foreground">{role.description}</Td>
              <Td>{role.permissions.length}</Td>
              <Td>
                {role.assignable ? (
                  <Badge variant="outline">By the organization</Badge>
                ) : (
                  <Badge variant="warning">From student records</Badge>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
