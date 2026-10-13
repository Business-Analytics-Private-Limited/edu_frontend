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
 *   - optionally a `secondary` button: the action reads which button was clicked, e.g.
 *     form.get('intent') === 'import' (the import page: "Check the file" / "Import students")
 *   - shows each field's problem UNDER the field as soon as the user leaves it (or tries to
 *     send): the browser's own checks (required, pattern, min/max …) on every <Field>
 *   - `ownButtons`: the form draws no buttons; the children do (e.g. a step-by-step wizard),
 *     and read "saving…" with useActionFormPending()
 *
 *   <ActionForm action={createInstitution} submitLabel="Add institution" resetOnSuccess>
 *     <Field label="Name" htmlFor="name"><Input id="name" name="name" required /></Field>
 *   </ActionForm>
 *
 * The action gets the previous result and the form's fields:
 *   async function createInstitution(_previous: FormState, form: FormData): Promise<FormState>
 */
import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useRef,
  useState,
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
  /** Sent with the form when the main button is clicked, e.g. name "intent", value "check". */
  submitName?: string;
  submitValue?: string;
  /** A second button for the same form, e.g. "Import students" next to "Check the file".
   *  The action sees which one was clicked by its `name` and `value`. */
  secondary?: { label: string; name: string; value: string; variant?: ButtonProps['variant'] };
  /** The children draw their own submit button(s) (see useActionFormPending). */
  ownButtons?: boolean;
  className?: string;
  children?: ReactNode;
}

const PendingContext = createContext(false);

/** Inside an ActionForm: true while it is being sent (to disable a custom submit button). */
export function useActionFormPending(): boolean {
  return useContext(PendingContext);
}

/**
 * Shows a field's problem under it: sets data-error on the surrounding <Field> (data-field),
 * which styles.css shows in red. Only after the user has left the field once (`force`), so
 * nobody gets told off while still typing.
 */
function markField(target: EventTarget, force: boolean) {
  if (!(
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  )) {
    return;
  }
  const box = target.closest<HTMLElement>('[data-field]');
  if (!box) return;
  if (!force && !box.dataset.touched) return;
  box.dataset.touched = '1';
  box.dataset.error = target.willValidate && !target.validity.valid ? target.validationMessage : '';
}

export function ActionForm({
  action,
  submitLabel,
  pendingLabel = 'Saving…',
  confirmMessage,
  resetOnSuccess = false,
  submitVariant,
  submitSize,
  submitName,
  submitValue,
  secondary,
  ownButtons = false,
  className,
  children,
}: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  // Which button sent the form, so only that one says "Saving…".
  const [clicked, setClicked] = useState<'main' | 'secondary'>('main');

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
    // Read now (the event is gone after await), with the clicked button's name and value.
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const fields = new FormData(event.currentTarget, submitter);
    const isSecondary = Boolean(secondary && submitter?.dataset.secondary);
    setClicked(isSecondary ? 'secondary' : 'main');
    if (confirmMessage) {
      const confirmed = await confirmDialog({
        text: confirmMessage,
        confirmText: isSecondary && secondary ? secondary.label : submitLabel,
        danger: submitVariant === 'destructive',
      });
      if (!confirmed) return;
    }
    startTransition(() => formAction(fields));
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onBlurCapture={(e) => markField(e.target, true)}
      onInputCapture={(e) => markField(e.target, false)}
      onChangeCapture={(e) => markField(e.target, false)}
      onInvalidCapture={(e) => markField(e.target, true)}
      className={cn('flex flex-col gap-4', className)}
    >
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
      {!ownButtons && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            name={submitName}
            value={submitValue}
            variant={submitVariant}
            size={submitSize}
            disabled={pending}
          >
            {pending && clicked === 'main' ? pendingLabel : submitLabel}
          </Button>
          {secondary && (
            <Button
              type="submit"
              name={secondary.name}
              value={secondary.value}
              data-secondary="1"
              variant={secondary.variant}
              size={submitSize}
              disabled={pending}
            >
              {pending && clicked === 'secondary' ? pendingLabel : secondary.label}
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
