/**
 * /institutions: the organization's colleges and schools, with their campuses.
 * Institutions are added by EduPlatform (the super admin) only (ADR-0025); open one to add
 * campuses or rename it.
 */
import { PageHeader, Table, TableHead, Td, Th } from '@eduplatform/ui';
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
              </Td>
              <Td>{institution.code}</Td>
              <Td>{institution._count.campuses}</Td>
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
