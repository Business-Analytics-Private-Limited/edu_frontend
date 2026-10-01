/**
 * /students/settings: per institution, how admission numbers are made.
 * With a pattern, an admission (or import row) with an empty admission number gets the next
 * number; numbers typed by hand still work. Needs "students.settings.update" for the institution.
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
import { setNumbering } from '../actions';

export default async function StudentSettingsPage() {
  const me = await getMe();
  const institutions = (
    can(me, 'platform.institution.view') ? await api<Institution[]>('/institutions') : []
  ).filter((i) => canAt(me, 'students.settings.update', { institutionId: i.id }));

  if (institutions.length === 0) {
    return (
      <>
        <PageHeader title="Student settings" />
        <EmptyState
          icon={<Settings />}
          title="Nothing to set"
          description="Your roles don't allow changing student settings for any institution."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Student settings"
        description="Automatic admission numbers, per institution."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {institutions.map((institution) => (
          <Card key={institution.id}>
            <CardHeader>
              <CardTitle>{institution.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm action={setNumbering.bind(null, institution.id)} submitLabel="Save">
                <Field
                  label="Admission number pattern"
                  htmlFor={`pattern-${institution.id}`}
                  hint="{CODE} = institution code, {YY} or {YYYY} = year (restarts every year), {SEQ:4} = running number. Empty = typed by hand."
                >
                  <Input
                    id={`pattern-${institution.id}`}
                    name="pattern"
                    defaultValue={institution.admissionNoPattern ?? ''}
                    placeholder="{CODE}{YY}{SEQ:4}"
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
