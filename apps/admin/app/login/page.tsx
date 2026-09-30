/**
 * /login: the super admin login page.
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
import { ShieldCheck } from 'lucide-react';
import { login } from './actions';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sidebar px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground [&_svg]:size-6">
            <ShieldCheck />
          </div>
          <CardTitle className="text-xl">Super admin console</CardTitle>
          <CardDescription>For EduPlatform staff only.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={login}
            submitLabel="Sign in"
            pendingLabel="Signing in…"
            submitSize="lg"
          >
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                autoFocus
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </Field>
          </ActionForm>
        </CardContent>
      </Card>
    </main>
  );
}
