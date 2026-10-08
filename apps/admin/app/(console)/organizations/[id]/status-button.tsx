'use client';
/**
 * "Suspend" / "Activate" button. A suspended organization's users cannot log in.
 */
import { Button, confirmDialog, notify } from '@eduplatform/ui';
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

  async function onClick() {
    if (
      suspend &&
      !(await confirmDialog({
        text: 'Suspend this organization? Its users will not be able to log in.',
        confirmText: 'Suspend',
        danger: true,
      }))
    )
      return;
    startTransition(async () => {
      const result = await setStatus(organizationId, suspend ? 'suspend' : 'activate');
      setError(result.error);
      if (result.error) notify(result.error, 'error');
      else if (result.success) notify(result.success);
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
