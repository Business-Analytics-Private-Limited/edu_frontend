/**
 * /academic/years: the organization's academic years, e.g. "2026-27", shared by every branch
 * (ADR-0030). One year is ACTIVE (the current one); activating another closes it. Only planned
 * years can be deleted. Managing years needs "academic.year.*" for the whole organization;
 * everyone with "academic.year.view" sees them.
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
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import { canAt, getMe } from '../../../../lib/me';
import type { AcademicYear } from '../../../../lib/types';
import { activateYear, createYear, deleteYear } from '../actions';

const STATUS_BADGE = { ACTIVE: 'success', PLANNED: 'outline', CLOSED: 'default' } as const;
const STATUS_LABEL = { ACTIVE: 'Current', PLANNED: 'Planned', CLOSED: 'Closed' } as const;

export default async function AcademicYearsPage() {
  const [me, years] = await Promise.all([getMe(), api<AcademicYear[]>('/academic-years')]);
  const organization = {};

  return (
    <>
      <PageHeader
        title="Academic years"
        description="One set of years for every branch; making a year current closes the previous one."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <TableHead>
              <tr>
                <Th>Year</Th>
                <Th>From</Th>
                <Th>To</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </TableHead>
            <tbody>
              {years.map((year) => (
                <tr key={year.id}>
                  <Td className="font-medium">{year.name}</Td>
                  <Td>{new Date(year.startsOn).toLocaleDateString()}</Td>
                  <Td>{new Date(year.endsOn).toLocaleDateString()}</Td>
                  <Td>
                    <Badge variant={STATUS_BADGE[year.status]}>{STATUS_LABEL[year.status]}</Badge>
                  </Td>
                  <Td className="text-right">
                    {year.status === 'PLANNED' && (
                      <div className="flex justify-end gap-1">
                        {canAt(me, 'academic.year.update', organization) && (
                          <ActionForm
                            action={activateYear.bind(null, year.id)}
                            submitLabel="Make current"
                            pendingLabel="…"
                            confirmMessage={`Make ${year.name} the current year? The current one will be closed.`}
                            submitVariant="outline"
                            submitSize="sm"
                          />
                        )}
                        {canAt(me, 'academic.year.delete', organization) && (
                          <ActionForm
                            action={deleteYear.bind(null, year.id)}
                            submitLabel="Delete"
                            pendingLabel="…"
                            confirmMessage={`Delete ${year.name}?`}
                            submitVariant="destructive"
                            submitSize="sm"
                          />
                        )}
                      </div>
                    )}
                  </Td>
                </tr>
              ))}
              {years.length === 0 && (
                <tr>
                  <Td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No academic years yet.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {canAt(me, 'academic.year.create', organization) && (
          <Card>
            <CardHeader>
              <CardTitle>Add academic year</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm action={createYear} submitLabel="Add year" resetOnSuccess>
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
