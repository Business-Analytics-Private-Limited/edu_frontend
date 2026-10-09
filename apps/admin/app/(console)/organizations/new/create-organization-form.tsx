/**
 * The "new organization" form (ADR-0030): the organization's details and TYPE (it decides the
 * academic structure), its branches and its first admin's login. Only the super admin adds
 * branches; more can be added later on the organization's page.
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
  Select,
} from '@eduplatform/ui';
import { Fragment } from 'react';
import { ORGANIZATION_TYPES } from '../../../../lib/types';
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
          <Field label="Type" htmlFor="type" hint="Decides how its classes are organized">
            <Select id="type" name="type" required defaultValue="INTERMEDIATE">
              {Object.entries(ORGANIZATION_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Code" htmlFor="code" hint="Used in admission numbers, e.g. SVJC">
            <Input id="code" name="code" required pattern="[A-Za-z0-9]{2,10}" placeholder="SVJC" />
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
          <CardTitle>Branches</CardTitle>
          <CardDescription>
            Its locations: at least one. More can be added on the organization&apos;s page.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          {[1, 2, 3, 4, 5].map((row) => (
            <Fragment key={row}>
              <Field label={`Branch ${row} name`} htmlFor={`branchName${row}`}>
                <Input
                  id={`branchName${row}`}
                  name={`branchName${row}`}
                  required={row === 1}
                  minLength={2}
                  placeholder={row === 1 ? 'KPHB' : 'Optional'}
                />
              </Field>
              <Field
                label="Code"
                htmlFor={`branchCode${row}`}
                hint={row === 1 ? 'Capital letters, digits, _ and -' : undefined}
              >
                <Input
                  id={`branchCode${row}`}
                  name={`branchCode${row}`}
                  required={row === 1}
                  pattern="[A-Za-z0-9_\-]{2,20}"
                  placeholder={row === 1 ? 'KPHB' : ''}
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
            Logs in to the web app with this email and a temporary password, then chooses their own.
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
