/**
 * Placeholder for screens that aren't built yet (students, attendance, …), so the sidebar
 * never leads to a broken page. Each real screen gets its own folder, which takes priority
 * over this catch-all route.
 */
import { EmptyState } from '@eduplatform/ui';
import { Construction } from 'lucide-react';

/** Which roadmap phase builds the screens under each path (docs/06-roadmap.md). */
const PHASE_BY_SECTION: Record<string, string> = {
  users: 'Phase 2',
  roles: 'Phase 2',
  audit: 'Phase 2',
  academic: 'Phase 3',
  students: 'Phase 4',
  attendance: 'Phase 5',
};

export default async function NotBuiltYetPage({ params }: { params: Promise<{ rest: string[] }> }) {
  const { rest } = await params;
  const section = rest[0] ?? '';
  const phase = PHASE_BY_SECTION[section];

  return (
    <EmptyState
      icon={<Construction />}
      title="This screen is not built yet"
      description={
        phase
          ? `The ${section} screens are built in ${phase} of the roadmap.`
          : 'This page does not exist.'
      }
    />
  );
}
