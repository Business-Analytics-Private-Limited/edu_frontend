'use client';
/**
 * "Suspend" / "Activate" button. A suspended organization's users cannot log in.
 */
import { Button, toast } from '@eduplatform/ui';
import { useState, useTransition } from 'react';
import { setStatus } from '../actions';
import type { OrganizationStatus } from '../../../../lib/types';

export function StatusButton({
  organizationId,
  status,
}: {
  organizationId: string;
  status: OrganizationStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const suspend = status === 'ACTIVE';

  function onClick() {
    if (suspend && !confirm('Suspend this organization? Its users will not be able to log in.'))
      return;
    startTransition(async () => {
      const result = await setStatus(organizationId, suspend ? 'suspend' : 'activate');
      setError(result.error);
      if (result.error) toast(result.error, 'error');
      else if (result.success) toast(result.success);
    });
  }

  return (
    <>
      <Button
        variant={suspend ? 'destructive' : 'default'}
        size="sm"
        disabled={pending}
        onClick={onClick}
      >
        {suspend ? 'Suspend' : 'Activate'}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </>
  );
}
