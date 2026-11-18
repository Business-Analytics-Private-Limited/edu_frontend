/**
 * /change-password: shown after logging in with a temporary password (set by an admin, or the
 * first super admin password from the server's settings). Nothing else opens until it is
 * changed (ADR-0028); the API refuses everything else too.
 */
import {
  ActionForm,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Input,
} from '@eduplatform/ui';
import { KeyRound } from 'lucide-react';
import { redirect } from 'next/navigation';
import { api } from '../../lib/api';
import type { Me } from '../../lib/types';
import { changeTemporaryPassword } from './actions';

export const metadata = { title: 'Choose your password' };

export default async function ChangePasswordPage() {
  const me = await api<Me>('/auth/me');
  if (!me.mustChangePassword) redirect('/');

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground [&_svg]:size-6">
            <KeyRound />
          </div>
          <CardTitle className="text-xl">Choose your own password</CardTitle>
          <CardDescription>
            Welcome, {me.name}. You signed in with a temporary password; choose your own before you
            continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={changeTemporaryPassword}
            submitLabel="Save and continue"
            pendingLabel="Saving…"
            submitSize="lg"
          >
            <Field label="Temporary password" htmlFor="currentPassword">
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                autoFocus
              />
            </Field>
            <Field
              label="New password"
              htmlFor="newPassword"
              hint="At least 10 characters, with a letter and a digit"
            >
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
          <form action="/logout" method="post" className="mt-4 text-center">
            <Button type="submit" variant="ghost" size="sm">
              Log out
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
