/**
 * Dashboard: the first page after login.
 *
 * For now it shows who is signed in (sample data until /me/bootstrap exists) and whether the
 * backend API is reachable. The API call shows the pattern every page uses: a server
 * component calls lib/api.ts, and the response type comes from the API contract.
 */
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@eduplatform/ui';
import { getHealth } from '../../lib/api';
import { getBootstrap } from '../../lib/bootstrap';

// Render on every request, never at build time: the backend may not be running during a build.
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const bootstrap = await getBootstrap();

  let apiReachable = false;
  try {
    apiReachable = (await getHealth()).data.status === 'ok'; // typed from the contract
  } catch {
    apiReachable = false;
  }

  return (
    <>
      <PageHeader
        title={`Welcome, ${bootstrap.user.displayName.split(' ')[0]}`}
        description={`${bootstrap.institution?.name ?? bootstrap.organization.displayName} · ${bootstrap.user.roleSummary}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Modules</CardTitle>
            <CardDescription>Switched on for your organization</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {bootstrap.modules.map((module) => (
              <Badge key={module.key}>{module.name}</Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backend API</CardTitle>
            <CardDescription>Connection from this app's server</CardDescription>
          </CardHeader>
          <CardContent>
            {apiReachable ? (
              <Badge variant="success">Connected</Badge>
            ) : (
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Badge variant="destructive" className="self-start">
                  Not reachable
                </Badge>
                Start the backend with <code>pnpm dev</code> in its repository.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sample data</CardTitle>
            <CardDescription>What you see is not real yet</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The user, organization and menu come from sample data until login and{' '}
            <code>/me/bootstrap</code> are connected in Phase 2.
          </CardContent>
        </Card>
      </div>
    </>
  );
}
