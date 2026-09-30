/**
 * /users/new: add a user with their first role and where it applies. More roles (e.g. faculty
 * at a second campus) are added on the user's page afterwards.
 */
import { ActionForm, Card, CardContent, Field, Input, PageHeader } from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import { getMe } from '../../../../lib/me';
import type { Institution, Role } from '../../../../lib/types';
import { createUser } from '../actions';
import { PlaceSelect, RoleSelect } from '../place';

export default async function NewUserPage() {
  const [me, roles, institutions] = await Promise.all([
    getMe(),
    api<Role[]>('/roles'),
    api<Institution[]>('/institutions'),
  ]);

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
            <RoleSelect roles={roles} />
            <PlaceSelect institutions={institutions} me={me} permission="access.user.create" />
          </ActionForm>
        </CardContent>
      </Card>
    </>
  );
}
