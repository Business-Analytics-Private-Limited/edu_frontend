/**
 * /login: the super admin login page: email and password, then (only with two-step login on)
 * the code from the authenticator app; see login-form.tsx.
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@eduplatform/ui';
import { ShieldCheck } from 'lucide-react';
import { LoginForm } from './login-form';

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
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
