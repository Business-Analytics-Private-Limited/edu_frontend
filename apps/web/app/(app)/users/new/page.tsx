/**
 * /users/new: add a user and tick their roles.
 */
import { ActionForm, Card, CardContent, Field, Input, PageHeader } from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import { getMe } from '../../../../lib/me';
import type { Role } from '../../../../lib/types';
import { createUser } from '../actions';
import { RoleChoices } from '../role-choices';

export default async function NewUserPage() {
  const [me, roles] = await Promise.all([getMe(), api<Role[]>('/roles')]);

  return (
    <>
      <PageHeader
        title="Add user"
        description="They log in with this email and the temporary password."
      />
      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <ActionForm action={createUser} submitLabel="Add user" pendingLabel="Adding…">
            <Field label="Name" htmlFor="name">
              <Input id="name" name="name" required minLength={2} />
            </Field>
            <Field label="Email" htmlFor="email">
              <Input id="email" name="email" type="email" required />
            </Field>
            <Field label="Temporary password" htmlFor="password" hint="At least 10 characters">
              <Input id="password" name="password" type="text" required minLength={10} />
            </Field>
            <RoleChoices roles={roles} checked={[]} myPermissions={me.permissions} />
          </ActionForm>
        </CardContent>
      </Card>
    </>
  );
}
