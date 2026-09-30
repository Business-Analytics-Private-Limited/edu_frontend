/**
 * / : the organization's dashboard. Every logged-in user can open it.
 */
import { Card, CardContent, CardHeader, CardTitle, PageHeader } from '@eduplatform/ui';
import { api } from '../../lib/api';
import { getMe } from '../../lib/me';
import type { Dashboard } from '../../lib/types';

export default async function DashboardPage() {
  const [me, data] = await Promise.all([getMe(), api<Dashboard>('/dashboard')]);

  const numbers = [
    { label: 'Institutions', value: data.institutions },
    { label: 'Campuses', value: data.campuses },
    { label: 'Users', value: data.users },
    { label: 'Active users', value: data.activeUsers },
    { label: 'Roles', value: data.roles },
  ];

  return (
    <>
      <PageHeader title={`Welcome, ${me.name}`} description="Your organization at a glance" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {numbers.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{item.value}</CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
