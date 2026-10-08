'use client';
/**
 * A form that sends its fields to a Next.js server action and shows the result.
 * Every form in both apps uses it, so they all behave the same:
 *   - shows the error or success message the action returns, in the form and as a pop-up
 *     in the corner (toast), so it is seen even when the form is off screen
 *   - disables the button while saving
 *   - keeps what the user typed when there is an error
 *   - optionally asks "Are you sure?" first, and optionally empties itself after success
 *
 *   <ActionForm action={createInstitution} submitLabel="Add institution" resetOnSuccess>
 *     <Field label="Name" htmlFor="name"><Input id="name" name="name" required /></Field>
 *   </ActionForm>
 *
 * The action gets the previous result and the form's fields:
 *   async function createInstitution(_previous: FormState, form: FormData): Promise<FormState>
 */
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  type FormEvent,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import { Alert } from './alert';
import { toast } from './toaster';
import { Button, type ButtonProps } from './button';

/** What a server action returns to the form: a message to show, or nothing. */
export interface FormState {
  error?: string;
  success?: string;
}

export interface ActionFormProps {
  action: (previous: FormState, form: FormData) => Promise<FormState>;
  submitLabel: string;
  pendingLabel?: string;
  /** Ask this question before sending, e.g. "Delete this campus?" */
  confirmMessage?: string;
  /** Empty the fields after a successful save (for "add" forms). */
  resetOnSuccess?: boolean;
  submitVariant?: ButtonProps['variant'];
  submitSize?: ButtonProps['size'];
  className?: string;
  children?: ReactNode;
}

export function ActionForm({
  action,
  submitLabel,
  pendingLabel = 'Saving…',
  confirmMessage,
  resetOnSuccess = false,
  submitVariant,
  submitSize,
  className,
  children,
}: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Every result also pops up in the corner, so it is seen even when the form is off screen.
    if (state.success) toast(state.success, 'success');
    if (state.error) toast(state.error, 'error');
    if (state.success && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  // We send the form ourselves (instead of <form action>) because React would otherwise
  // empty every field after each send, also when the server said "error".
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    const fields = new FormData(event.currentTarget);
    startTransition(() => formAction(fields));
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className={cn('flex flex-col gap-4', className)}>
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      {children}
      <div>
        <Button type="submit" variant={submitVariant} size={submitSize} disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
