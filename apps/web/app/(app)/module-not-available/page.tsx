/**
 * Shown when a user opens a module their organization doesn't have (or that is switched
 * off), instead of a broken screen (docs/05-module-catalog.md §5.6).
 */
import { Button, EmptyState } from '@eduplatform/ui';
import { PackageX } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Module not available' };

export default function ModuleNotAvailablePage() {
  return (
    <EmptyState
      icon={<PackageX />}
      title="Module not available"
      description="Your organization doesn't have this module switched on. Contact your organization administrator if you need it."
      action={
        <Button asChild variant="outline">
          <Link href="/">Back to dashboard</Link>
        </Button>
      }
    />
  );
}
