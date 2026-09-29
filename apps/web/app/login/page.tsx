/**
 * Login page. The "Sign in" button starts Keycloak login (connected in the next Phase 2
 * step); passwords are never typed into this app, only into Keycloak's own page.
 */
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@eduplatform/ui';
import { LogIn } from 'lucide-react';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sidebar px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            E
          </div>
          <CardTitle className="text-xl">Sign in to EduPlatform</CardTitle>
          <CardDescription>
            Staff, parents and students sign in with the account from their institution.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Connected to Keycloak (GET /auth/login) in the next step. */}
          <Button size="lg" className="w-full" disabled>
            <LogIn />
            Sign in
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Forgot your password? Use “Forgot password” on the sign-in page.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
