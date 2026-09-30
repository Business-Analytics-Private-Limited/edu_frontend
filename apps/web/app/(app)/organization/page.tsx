/**
 * /organization: the organization's details and the modules it has.
 * Users with "platform.organization.update" can edit the contact details.
 */
import {
  ActionForm,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Input,
  PageHeader,
} from '@eduplatform/ui';
import { api } from '../../../lib/api';
import { canAt, getMe } from '../../../lib/me';
import type { OwnOrganization } from '../../../lib/types';
import { updateOrganization } from './actions';

export default async function OrganizationPage() {
  const [me, org] = await Promise.all([getMe(), api<OwnOrganization>('/organization')]);
  const canEdit = canAt(me, 'platform.organization.update', {});

  return (
    <>
      <PageHeader title={org.name} description={`Slug: ${org.slug}`} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
            <CardDescription>Who EduPlatform contacts about this organization.</CardDescription>
          </CardHeader>
          <CardContent>
            {canEdit ? (
              <ActionForm action={updateOrganization} submitLabel="Save">
                <Field label="Contact person" htmlFor="contactName">
                  <Input id="contactName" name="contactName" defaultValue={org.contactName ?? ''} />
                </Field>
                <Field label="Email" htmlFor="contactEmail">
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    defaultValue={org.contactEmail ?? ''}
                  />
                </Field>
                <Field label="Phone" htmlFor="contactPhone">
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    defaultValue={org.contactPhone ?? ''}
                  />
                </Field>
              </ActionForm>
            ) : (
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Contact person</dt>
                <dd>{org.contactName ?? '—'}</dd>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{org.contactEmail ?? '—'}</dd>
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{org.contactPhone ?? '—'}</dd>
              </dl>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modules</CardTitle>
            <CardDescription>Switched on by EduPlatform. Contact us to add more.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {org.modules.length === 0 && (
              <p className="text-sm text-muted-foreground">No modules yet.</p>
            )}
            {org.modules.map((module) => (
              <Badge key={module.key}>{module.name}</Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
