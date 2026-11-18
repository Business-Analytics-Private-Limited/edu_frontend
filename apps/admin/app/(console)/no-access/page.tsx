/**
 * Shown when the API says "403: not allowed" for a page (see lib/api.ts).
 */
import { Button, EmptyState } from '@eduplatform/ui';
import { Lock } from 'lucide-react';
import Link from 'next/link';

export default function NoAccessPage() {
  return (
    <EmptyState
      icon={<Lock />}
      title="No access"
      description="Your account is not allowed to open this page."
      action={
        <Button asChild variant="outline">
          <Link href="/">Back to dashboard</Link>
        </Button>
      }
    />
  );
}
