/**
 * Console overview: what platform staff can do here, and when each screen arrives.
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

/** The v1 console screens (docs/05-module-catalog.md §5.7) and their roadmap phase. */
const SCREENS = [
  { name: 'Organizations', purpose: 'Onboard, suspend and reactivate tenants', phase: 'Phase 2' },
  {
    name: 'Entitlements',
    purpose: 'Which modules and variants each tenant may use',
    phase: 'Phase 2',
  },
  { name: 'Plans', purpose: 'Module bundles such as Starter or Standard', phase: 'Phase 2' },
  { name: 'Feature flags', purpose: 'Gradual rollout of new features', phase: 'Phase 2' },
  { name: 'Role templates', purpose: 'The default roles new tenants receive', phase: 'Phase 2' },
  {
    name: 'Impersonation',
    purpose: 'Support access with a reason, time-limited and audited',
    phase: 'Phase 2',
  },
  { name: 'Usage', purpose: 'Students, users and storage per tenant', phase: 'Phase 2' },
  { name: 'Devices', purpose: 'Biometric devices across tenants', phase: 'Phase 5' },
];

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Super admin console"
        description="Manage organizations, their modules and the platform. All actions are audited."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SCREENS.map((screen) => (
          <Card key={screen.name}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle>{screen.name}</CardTitle>
                <Badge variant="outline">{screen.phase}</Badge>
              </div>
              <CardDescription>{screen.purpose}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
    </>
  );
}
