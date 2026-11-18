/**
 * /branches: the organization's branches (locations, ADR-0030) with their current students.
 * Branches are added and closed by EduPlatform (the super admin) only; open one to rename it or
 * to go to its sections, students and attendance. A Branch admin sees their own branch only.
 */
import { Badge, PageHeader, Table, TableHead, Td, Th } from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../../lib/api';
import type { Branch } from '../../../lib/types';

export default async function BranchesPage() {
  const branches = await api<Branch[]>('/branches');

  return (
    <>
      <PageHeader
        title="Branches"
        description="Your organization's locations. To add or close one, contact EduPlatform."
      />

      <Table>
        <TableHead>
          <tr>
            <Th>Name</Th>
            <Th>Code</Th>
            <Th>Current students</Th>
          </tr>
        </TableHead>
        <tbody>
          {branches.map((branch) => (
            <tr key={branch.id}>
              <Td>
                <Link
                  href={`/branches/${branch.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {branch.name}
                </Link>
                {branch.status !== 'ACTIVE' && (
                  <Badge variant="outline" className="ml-2">
                    Inactive
                  </Badge>
                )}
              </Td>
              <Td>{branch.code}</Td>
              <Td>{branch.students ?? 0}</Td>
            </tr>
          ))}
          {branches.length === 0 && (
            <tr>
              <Td colSpan={3} className="py-8 text-center text-muted-foreground">
                No branches yet.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  );
}
