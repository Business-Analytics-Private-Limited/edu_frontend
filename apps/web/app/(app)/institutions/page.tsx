/**
 * /institutions: the organization's colleges and schools, and a form to add one
 * (only for users with "platform.institution.create").
 */
import {
  ActionForm,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
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
import { INSTITUTION_TYPES, type Institution } from '../../../lib/types';
import { createInstitution } from './actions';

export default async function InstitutionsPage() {
  const [me, institutions] = await Promise.all([getMe(), api<Institution[]>('/institutions')]);

  return (
    <>
      <PageHeader title="Institutions" description="Colleges and schools in your organization" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <TableHead>
              <tr>
                <Th>Name</Th>
                <Th>Code</Th>
                <Th>Type</Th>
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
                  <Td>{INSTITUTION_TYPES[institution.type]}</Td>
                  <Td>{institution._count.campuses}</Td>
                </tr>
              ))}
              {institutions.length === 0 && (
                <tr>
                  <Td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No institutions yet.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {can(me, 'platform.institution.create') && (
          <Card>
            <CardHeader>
              <CardTitle>Add institution</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm action={createInstitution} submitLabel="Add institution" resetOnSuccess>
                <Field label="Name" htmlFor="name">
                  <Input
                    id="name"
                    name="name"
                    required
                    minLength={2}
                    placeholder="Sri Vidya Junior College"
                  />
                </Field>
                <Field label="Code" htmlFor="code" hint="Capital letters, digits, _ and -">
                  <Input
                    id="code"
                    name="code"
                    required
                    pattern="[A-Z0-9_\-]{2,20}"
                    placeholder="SVJC"
                  />
                </Field>
                <Field label="Type" htmlFor="type">
                  <Select id="type" name="type" required>
                    {Object.entries(INSTITUTION_TYPES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </ActionForm>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
