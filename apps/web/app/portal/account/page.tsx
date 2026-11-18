/**
 * /portal/account: a parent or student changes their own password.
 */
import { ActionForm, Card, CardContent, Field, Input, PageHeader } from '@eduplatform/ui';
import { changePassword } from '../../(app)/account/actions';

export const metadata = { title: 'Change password' };

export default function AccountPage() {
  return (
    <>
      <PageHeader title="Change password" />
      <Card className="max-w-md">
        <CardContent className="pt-6">
          <ActionForm action={changePassword} submitLabel="Change password" resetOnSuccess>
            <Field label="Current password" htmlFor="currentPassword">
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
            </Field>
            <Field label="New password" htmlFor="newPassword" hint="At least 10 characters">
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={10}
                required
              />
            </Field>
            <Field label="New password again" htmlFor="repeatPassword">
              <Input
                id="repeatPassword"
                name="repeatPassword"
                type="password"
                autoComplete="new-password"
                required
              />
            </Field>
          </ActionForm>
        </CardContent>
      </Card>
    </>
  );
}
