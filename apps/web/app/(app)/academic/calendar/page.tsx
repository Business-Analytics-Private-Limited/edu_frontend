/**
 * /academic/calendar: the days without classes.
 *   - weekly off days for the whole organization (e.g. Sunday), changed with
 *     "academic.calendar.update" for the whole organization;
 *   - holidays, one day or a range, for every branch or one branch (a Branch admin adds their
 *     branch's holidays). Attendance uses this to know the working days.
 */
import {
  ActionForm,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
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
import type { Branch, Calendar } from '../../../../lib/types';
import { createHoliday, deleteHoliday, setWeeklyOff } from '../actions';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function CalendarPage() {
  const me = await getMe();
  const [calendar, branches] = await Promise.all([
    api<Calendar>('/calendar'),
    can(me, 'platform.branch.view') ? api<Branch[]>('/branches') : [],
  ]);
  // Where the user may add holidays: every branch, or single branches in use.
  const places = [
    ...(canAt(me, 'academic.calendar.create', {}) ? [{ value: '', label: 'Every branch' }] : []),
    ...branches
      .filter(
        (b) => b.status === 'ACTIVE' && canAt(me, 'academic.calendar.create', { branchId: b.id }),
      )
      .map((b) => ({ value: b.id, label: b.name })),
  ];
  const canSetWeeklyOff = canAt(me, 'academic.calendar.update', {});

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Weekly off days and holidays: the days without classes."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly off days</CardTitle>
          </CardHeader>
          <CardContent>
            {canSetWeeklyOff ? (
              <ActionForm action={setWeeklyOff} submitLabel="Save" className="gap-2">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {WEEKDAYS.map((day, index) => (
                    <Checkbox
                      key={day}
                      name="days"
                      value={String(index)}
                      label={day}
                      defaultChecked={calendar.weeklyOffDays.includes(index)}
                    />
                  ))}
                </div>
              </ActionForm>
            ) : (
              <div className="flex flex-wrap gap-2">
                {calendar.weeklyOffDays.map((d) => (
                  <Badge key={d}>{WEEKDAYS[d]}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Holidays</h2>
          <Table>
            <TableHead>
              <tr>
                <Th>Holiday</Th>
                <Th>Dates</Th>
                <Th>Where</Th>
                <Th />
              </tr>
            </TableHead>
            <tbody>
              {calendar.holidays.map((h) => {
                const from = new Date(h.startsOn).toLocaleDateString();
                const to = new Date(h.endsOn).toLocaleDateString();
                const where = h.branch ? h.branch.name : 'Every branch';
                return (
                  <tr key={h.id}>
                    <Td className="font-medium">{h.name}</Td>
                    <Td>{from === to ? from : `${from} – ${to}`}</Td>
                    <Td className="text-muted-foreground">{where}</Td>
                    <Td className="text-right">
                      {canAt(me, 'academic.calendar.delete', { branchId: h.branchId }) && (
                        <ActionForm
                          action={deleteHoliday.bind(null, h.id)}
                          submitLabel="Delete"
                          pendingLabel="…"
                          confirmMessage={`Delete ${h.name}?`}
                          submitVariant="destructive"
                          submitSize="sm"
                        />
                      )}
                    </Td>
                  </tr>
                );
              })}
              {calendar.holidays.length === 0 && (
                <tr>
                  <Td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No holidays yet.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {places.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Add holiday</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm action={createHoliday} submitLabel="Add holiday" resetOnSuccess>
                <Field label="Name" htmlFor="holidayName">
                  <Input id="holidayName" name="name" required placeholder="Sankranti" />
                </Field>
                <Field label="From" htmlFor="startsOn">
                  <Input id="startsOn" name="startsOn" type="date" required />
                </Field>
                <Field label="To" htmlFor="endsOn" hint="Leave empty for one day">
                  <Input id="endsOn" name="endsOn" type="date" />
                </Field>
                <Field label="Where" htmlFor="branchId">
                  <Select id="branchId" name="branchId">
                    {places.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
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
