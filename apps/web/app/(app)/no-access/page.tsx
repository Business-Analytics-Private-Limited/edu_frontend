/**
 * Shown when the user's roles don't allow a screen (docs/05-module-catalog.md §5.6).
 */
import { Button, EmptyState } from '@eduplatform/ui';
import { Lock } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'No access' };

export default function NoAccessPage() {
  return (
    <EmptyState
      icon={<Lock />}
      title="No access"
      description="Your role doesn't include access to this page. If you think it should, ask your institution administrator."
      action={
        <Button asChild variant="outline">
          <Link href="/">Back to dashboard</Link>
        </Button>
      }
    />
  );
}
