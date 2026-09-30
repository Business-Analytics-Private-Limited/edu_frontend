/**
 * /users/new: add a user. The role decides what they may do.
 */
import { ActionForm, Card, CardContent, Field, Input, PageHeader, Select } from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import type { Role } from '../../../../lib/types';
import { createUser } from '../actions';

export default async function NewUserPage() {
  const roles = await api<Role[]>('/roles');

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
            <Field label="Role" htmlFor="roleId">
              <Select id="roleId" name="roleId" required>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Select>
            </Field>
          </ActionForm>
        </CardContent>
      </Card>
    </>
  );
}
