/**
 * /institutions: the organization's colleges and schools, with their campuses.
 * Institutions are added by EduPlatform (the super admin) only (ADR-0025); open one to add
 * campuses or rename it.
 */
import { Badge, PageHeader, Table, TableHead, Td, Th } from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../../lib/api';
import type { Institution } from '../../../lib/types';

export default async function InstitutionsPage() {
  const institutions = await api<Institution[]>('/institutions');

  return (
    <>
      <PageHeader
        title="Institutions"
        description="Colleges and schools in your organization. To add one, contact EduPlatform."
      />

      <Table>
        <TableHead>
          <tr>
            <Th>Name</Th>
            <Th>Code</Th>
            <Th>Campuses</Th>
          </tr>
        </TableHead>
        <tbody>
          {institutions.map((institution) => (
            <tr key={institution.id}>
              <Td>
                <Link
                  href={`/institutions/${institution.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {institution.name}
                </Link>
                {institution.status !== 'ACTIVE' && (
                  <Badge variant="outline" className="ml-2">
                    Inactive
                  </Badge>
                )}
              </Td>
              <Td>{institution.code}</Td>
              <Td>
                {institution.campuses.filter((c) => c.status === 'ACTIVE').length}
                {institution.campuses.some((c) => c.status !== 'ACTIVE') && (
                  <span className="text-muted-foreground">
                    {' '}
                    (+{institution.campuses.filter((c) => c.status !== 'ACTIVE').length} inactive)
                  </span>
                )}
              </Td>
            </tr>
          ))}
          {institutions.length === 0 && (
            <tr>
              <Td colSpan={3} className="py-8 text-center text-muted-foreground">
                No institutions yet.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  );
}
