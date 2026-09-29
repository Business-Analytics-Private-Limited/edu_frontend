/**
 * Login page for platform staff. Uses Keycloak's `platform` realm, which requires a one-time
 * password (MFA). Connected to Keycloak in the next Phase 2 step.
 */
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@eduplatform/ui';
import { ShieldCheck } from 'lucide-react';

export const metadata = { title: 'Sign in' };

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sidebar px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground [&_svg]:size-6">
            <ShieldCheck />
          </div>
          <CardTitle className="text-xl">Super admin console</CardTitle>
          <CardDescription>
            For EduPlatform staff only. Sign-in requires a one-time password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Connected to Keycloak (platform realm) in the next step. */}
          <Button size="lg" className="w-full" disabled>
            Sign in
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
