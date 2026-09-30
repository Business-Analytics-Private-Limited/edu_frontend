/**
 * The "new organization" form: the organization's details and its first admin's login.
 */
import {
  ActionForm,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Input,
} from '@eduplatform/ui';
import { createOrganization } from '../actions';

export function CreateOrganizationForm() {
  return (
    <ActionForm
      action={createOrganization}
      submitLabel="Create organization"
      pendingLabel="Creating…"
      className="max-w-2xl gap-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>The school group, college society or trust.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="name">
            <Input id="name" name="name" required placeholder="Sri Vidya Educational Society" />
          </Field>
          <Field
            label="Slug"
            htmlFor="slug"
            hint="Short unique name: lowercase letters, digits, dashes"
          >
            <Input
              id="slug"
              name="slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="sri-vidya"
            />
          </Field>
          <Field label="Contact person" htmlFor="contactName">
            <Input id="contactName" name="contactName" />
          </Field>
          <Field label="Contact email" htmlFor="contactEmail">
            <Input id="contactEmail" name="contactEmail" type="email" />
          </Field>
          <Field label="Contact phone" htmlFor="contactPhone">
            <Input id="contactPhone" name="contactPhone" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>First admin</CardTitle>
          <CardDescription>
            Logs in to the web app with this email and password, and should change the password.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="adminName">
            <Input id="adminName" name="adminName" required />
          </Field>
          <Field label="Email" htmlFor="adminEmail">
            <Input id="adminEmail" name="adminEmail" type="email" required />
          </Field>
          <Field label="Temporary password" htmlFor="adminPassword" hint="At least 10 characters">
            <Input id="adminPassword" name="adminPassword" type="text" minLength={10} required />
          </Field>
        </CardContent>
      </Card>
    </ActionForm>
  );
}
