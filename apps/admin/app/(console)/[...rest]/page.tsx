/**
 * Placeholder for console screens that aren't built yet, so the menu never leads to a
 * broken page. Each real screen gets its own folder, which takes priority over this route.
 */
import { EmptyState } from '@eduplatform/ui';
import { Construction } from 'lucide-react';

export default function NotBuiltYetPage() {
  return (
    <EmptyState
      icon={<Construction />}
      title="This screen is not built yet"
      description="Console screens are built during Phase 2 (devices in Phase 5)."
    />
  );
}
