/**
 * /users/new: add a user with their first role and where it applies. More roles (e.g. faculty
 * at a second branch) are added on the user's page afterwards.
 */
import { ActionForm, Card, CardContent, Field, Input, PageHeader } from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import { can, getMe } from '../../../../lib/me';
import type { Branch, Role } from '../../../../lib/types';
import { createUser } from '../actions';
import { PlaceSelect, RoleSelect } from '../place';

export default async function NewUserPage() {
  const me = await getMe();
  const [roles, branches] = await Promise.all([
    api<Role[]>('/roles'),
    // The "Where" list; without seeing branches only "Whole organization" can be offered.
    can(me, 'platform.branch.view') ? api<Branch[]>('/branches') : [],
  ]);

  return (
    <>
      <PageHeader
        back={{ href: '/users', label: 'Back to users' }}
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
            <PlaceSelect branches={branches} me={me} permission="access.user.create" />
          </ActionForm>
        </CardContent>
      </Card>
    </>
  );
}
