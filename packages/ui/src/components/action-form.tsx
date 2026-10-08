'use client';
/**
 * A form that sends its fields to a Next.js server action and shows the result.
 * Every form in both apps uses it, so they all behave the same:
 *   - shows the error or success message the action returns, in the form and as a pop-up
 *     alert in the middle of the screen (alerts.tsx), so it is seen even when the form is
 *     off screen
 *   - `confirmMessage` asks "Are you sure?" in a pop-up first; the confirm button says
 *     `submitLabel` and is red for destructive buttons
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
import { confirmDialog, notify } from './alerts';
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
    if (state.success) notify(state.success, 'success');
    if (state.error) notify(state.error, 'error');
    if (state.success && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  // We send the form ourselves (instead of <form action>) because React would otherwise
  // empty every field after each send, also when the server said "error".
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget); // read now: the event is gone after await
    if (confirmMessage) {
      const confirmed = await confirmDialog({
        text: confirmMessage,
        confirmText: submitLabel,
        danger: submitVariant === 'destructive',
      });
      if (!confirmed) return;
    }
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
