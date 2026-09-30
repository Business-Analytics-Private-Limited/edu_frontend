'use client';
/**
 * One module's on/off checkbox. Ticking it calls the setModule server action right away.
 * The API refuses when a needed module is off (for example "attendance" needs "students");
 * that message is shown under the checkbox.
 */
import { Checkbox } from '@eduplatform/ui';
import { useState, useTransition } from 'react';
import { setModule } from '../actions';

export function ModuleSwitch(props: {
  organizationId: string;
  moduleKey: string;
  name: string;
  description: string;
  enabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function toggle(enabled: boolean) {
    startTransition(async () => {
      const result = await setModule(props.organizationId, props.moduleKey, enabled);
      setError(result.error);
    });
  }

  return (
    <div>
      <Checkbox
        label={props.name}
        description={props.description}
        checked={props.enabled}
        disabled={pending}
        onChange={(event) => toggle(event.target.checked)}
      />
      {error && <p className="ml-6 mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
