/**
 * /academic/years: each institution's academic years, e.g. "2026-27". One year per institution
 * is ACTIVE (the current one); activating another closes it. Only planned years can be deleted.
 * Managing years needs "academic.year.*" for the institution (a Principal or an organization-wide
 * admin); people working at one campus see their institution's years.
 */
import {
  ActionForm,
  Badge,
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
import { api } from '../../../../lib/api';
import { can, canAt, getMe } from '../../../../lib/me';
import type { AcademicYear, Institution } from '../../../../lib/types';
import { activateYear, createYear, deleteYear } from '../actions';

const STATUS_BADGE = { ACTIVE: 'success', PLANNED: 'outline', CLOSED: 'default' } as const;

export default async function AcademicYearsPage() {
  const me = await getMe();
  const [years, institutions] = await Promise.all([
    api<AcademicYear[]>('/academic-years'),
    can(me, 'platform.institution.view') ? api<Institution[]>('/institutions') : [],
  ]);
  const canCreateIn = institutions.filter((i) =>
    canAt(me, 'academic.year.create', { institutionId: i.id }),
  );

  return (
    <>
      <PageHeader
        title="Academic years"
        description="One active year per institution; activating a year closes the previous one."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <TableHead>
              <tr>
                <Th>Institution</Th>
                <Th>Year</Th>
                <Th>From</Th>
                <Th>To</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </TableHead>
            <tbody>
              {years.map((year) => {
                const here = { institutionId: year.institutionId };
                return (
                  <tr key={year.id}>
                    <Td>{year.institution.name}</Td>
                    <Td className="font-medium">{year.name}</Td>
                    <Td>{new Date(year.startsOn).toLocaleDateString()}</Td>
                    <Td>{new Date(year.endsOn).toLocaleDateString()}</Td>
                    <Td>
                      <Badge variant={STATUS_BADGE[year.status]}>{year.status}</Badge>
                    </Td>
                    <Td className="text-right">
                      {year.status === 'PLANNED' && (
                        <div className="flex justify-end gap-1">
                          {canAt(me, 'academic.year.update', here) && (
                            <ActionForm
                              action={activateYear.bind(null, year.id)}
                              submitLabel="Make current"
                              pendingLabel="…"
                              confirmMessage={`Make ${year.name} the current year of ${year.institution.name}? The current one will be closed.`}
                              submitVariant="outline"
                              submitSize="sm"
                            />
                          )}
                          {canAt(me, 'academic.year.delete', here) && (
                            <ActionForm
                              action={deleteYear.bind(null, year.id)}
                              submitLabel="Delete"
                              pendingLabel="…"
                              confirmMessage={`Delete ${year.name}?`}
                              submitVariant="ghost"
                              submitSize="sm"
                            />
                          )}
                        </div>
                      )}
                    </Td>
                  </tr>
                );
              })}
              {years.length === 0 && (
                <tr>
                  <Td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No academic years yet.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {canCreateIn.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Add academic year</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm action={createYear} submitLabel="Add year" resetOnSuccess>
                <Field label="Institution" htmlFor="institutionId">
                  <Select id="institutionId" name="institutionId" required>
                    {canCreateIn.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Name" htmlFor="name">
                  <Input id="name" name="name" required placeholder="2026-27" />
                </Field>
                <Field label="Starts on" htmlFor="startsOn">
                  <Input id="startsOn" name="startsOn" type="date" required />
                </Field>
                <Field label="Ends on" htmlFor="endsOn">
                  <Input id="endsOn" name="endsOn" type="date" required />
                </Field>
              </ActionForm>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
