/**
 * /attendance/settings: per institution, the time zone (which decides what "today" is) and how
 * many days back a past day may still be marked or changed. Needs "attendance.policy.update".
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
import { can, canAt, getMe } from '../../../../lib/me';
import type { Institution } from '../../../../lib/types';
import { saveAttendanceSettings } from '../actions';

export default async function AttendanceSettingsPage() {
  const me = await getMe();
  const institutions = (
    can(me, 'platform.institution.view') ? await api<Institution[]>('/institutions') : []
  ).filter((i) => canAt(me, 'attendance.policy.update', { institutionId: i.id }));

  if (institutions.length === 0) {
    return (
      <>
        <PageHeader title="Attendance settings" />
        <EmptyState
          icon={<Settings />}
          title="Nothing to set"
          description="Your roles don't allow changing attendance settings for any institution."
        />
      </>
    );
  }
  return (
    <>
      <PageHeader title="Attendance settings" />
      <div className="grid gap-6 lg:grid-cols-2">
        {institutions.map((institution) => (
          <Card key={institution.id}>
            <CardHeader>
              <CardTitle>{institution.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm
                action={saveAttendanceSettings.bind(null, institution.id)}
                submitLabel="Save"
              >
                <Field
                  label="Time zone"
                  htmlFor={`tz-${institution.id}`}
                  hint="Decides what 'today' is, e.g. Asia/Kolkata"
                >
                  <Input
                    id={`tz-${institution.id}`}
                    name="timeZone"
                    defaultValue={institution.timeZone ?? 'Asia/Kolkata'}
                    required
                  />
                </Field>
                <Field
                  label="Correction window (days)"
                  htmlFor={`days-${institution.id}`}
                  hint="How many days back attendance may still be marked or corrected; 0 = only today"
                >
                  <Input
                    id={`days-${institution.id}`}
                    name="correctionDays"
                    type="number"
                    min={0}
                    max={365}
                    defaultValue={institution.attendanceCorrectionDays ?? 7}
                    required
                  />
                </Field>
              </ActionForm>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
