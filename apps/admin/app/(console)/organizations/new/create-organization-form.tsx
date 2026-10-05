/**
 * The "new organization" form: the organization's details, its institutions and its first
 * admin's login. Only the super admin adds institutions (ADR-0025); more can be added later on
 * the organization's page.
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
import { Fragment } from 'react';
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
          <CardTitle>Institutions</CardTitle>
          <CardDescription>
            Its colleges or schools: at least one. Each sets up its own class levels later. More can
            be added on the organization's page.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          {[1, 2, 3].map((row) => (
            <Fragment key={row}>
              <Field label={`Institution ${row} name`} htmlFor={`institutionName${row}`}>
                <Input
                  id={`institutionName${row}`}
                  name={`institutionName${row}`}
                  required={row === 1}
                  minLength={2}
                  placeholder={row === 1 ? 'Sri Vidya Junior College' : 'Optional'}
                />
              </Field>
              <Field
                label="Code"
                htmlFor={`institutionCode${row}`}
                hint={row === 1 ? 'Capital letters, digits, _ and -' : undefined}
              >
                <Input
                  id={`institutionCode${row}`}
                  name={`institutionCode${row}`}
                  required={row === 1}
                  pattern="[A-Za-z0-9_\-]{2,20}"
                  placeholder={row === 1 ? 'SVJC' : ''}
                />
              </Field>
            </Fragment>
          ))}
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
