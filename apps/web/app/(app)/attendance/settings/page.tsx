/**
 * /attendance/settings: for the whole organization, the time zone (which decides what "today"
 * is) and how many days back a past day may still be marked or changed. Needs
 * "attendance.policy.update" for the whole organization.
 */
import {
  ActionForm,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  PageHeader,
} from '@eduplatform/ui';
import { Settings } from 'lucide-react';
import { api } from '../../../../lib/api';
import { canAt, getMe } from '../../../../lib/me';
import type { OwnOrganization } from '../../../../lib/types';
import { saveAttendanceSettings } from '../actions';

export default async function AttendanceSettingsPage() {
  const me = await getMe();
  if (!canAt(me, 'attendance.policy.update', {})) {
    return (
      <>
        <PageHeader
          back={{ href: '/attendance', label: 'Back to attendance' }}
          title="Attendance settings"
        />
        <EmptyState
          icon={<Settings />}
          title="Nothing to set"
          description="Attendance settings are for the whole organization (the Organization admin)."
        />
      </>
    );
  }
  const organization = await api<OwnOrganization>('/organization');
  return (
    <>
      <PageHeader
        back={{ href: '/attendance', label: 'Back to attendance' }}
        title="Attendance settings"
        description="For every branch."
      />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Time and corrections</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={saveAttendanceSettings} submitLabel="Save">
            <Field
              label="Time zone"
              htmlFor="timeZone"
              hint="Decides what 'today' is, e.g. Asia/Kolkata"
            >
              <Input id="timeZone" name="timeZone" defaultValue={organization.timeZone} required />
            </Field>
            <Field
              label="Correction window (days)"
              htmlFor="correctionDays"
              hint="How many days back attendance may still be marked or corrected; 0 = only today"
            >
              <Input
                id="correctionDays"
                name="correctionDays"
                type="number"
                min={0}
                max={365}
                defaultValue={organization.attendanceCorrectionDays}
                required
              />
            </Field>
          </ActionForm>
        </CardContent>
      </Card>
    </>
  );
}
