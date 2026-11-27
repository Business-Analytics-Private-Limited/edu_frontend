'use client';
/**
 * "Reset password" for an admin (ADR-0036 in the backend): asks "Are you sure?", calls the
 * server action, then shows the new temporary password ONCE in a pop-up with a Copy button.
 * The person must change it at their next login.
 *
 *   <ResetPasswordButton name={user.name} reset={resetPassword.bind(null, user.id)} />
 *
 * The API makes the password; nobody types it. It is only kept in this component's state while
 * the pop-up is open: closing it forgets the password, so it can't be seen again later.
 */
import { useEffect, useRef, useState, useTransition } from 'react';
import type { FormState } from './action-form';
import { confirmDialog, notify } from './alerts';
import { Button, type ButtonProps } from './button';

/** What the reset action returns: an error, or the new temporary password. */
export interface ResetPasswordResult extends FormState {
  temporaryPassword?: string;
}

export interface ResetPasswordButtonProps {
  /** Whose password, for the messages, e.g. "Ravi Kumar". */
  name: string;
  /** The server action (bound to the user), e.g. resetPassword.bind(null, user.id). */
  reset: () => Promise<ResetPasswordResult>;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
}

export function ResetPasswordButton({
  name,
  reset,
  variant = 'outline',
  size = 'sm',
}: ResetPasswordButtonProps) {
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState<string>();

  async function onClick() {
    const confirmed = await confirmDialog({
      title: `Reset ${name}'s password?`,
      text: 'Their current password stops working and they are logged out everywhere. You get a temporary password to give them; they must choose a new one when they log in.',
      confirmText: 'Reset password',
      danger: true,
    });
    if (!confirmed) return;
    startTransition(async () => {
      const result = await reset();
      if (result.error) void notify(result.error, 'error');
      else setPassword(result.temporaryPassword);
    });
  }

  return (
    <>
      <Button variant={variant} size={size} disabled={pending} onClick={onClick}>
        {pending ? 'Resetting…' : 'Reset password'}
      </Button>
      {password && (
        <TemporaryPasswordDialog
          name={name}
          password={password}
          onClose={() => setPassword(undefined)}
        />
      )}
    </>
  );
}

/** The pop-up with the new password. A modal <dialog>, like the alerts (alerts.tsx). */
function TemporaryPasswordDialog({
  name,
  password,
  onClose,
}: {
  name: string;
  password: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const passwordRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      // No clipboard (e.g. a plain http address): select the text so Ctrl+C works.
      const range = document.createRange();
      if (passwordRef.current) range.selectNodeContents(passwordRef.current);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="temporary-password-title"
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-transparent"
    >
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-card p-5 text-left text-card-foreground shadow-2xl sm:max-w-md sm:p-6">
          <h2 id="temporary-password-title" className="text-lg font-semibold">
            New temporary password
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Give it to {name} in person or by phone. It is shown only now; they must change it when
            they log in.
          </p>
          <code
            ref={passwordRef}
            className="mt-4 block select-all break-all rounded-md border bg-muted px-3 py-3 text-center font-mono text-xl tracking-wider"
          >
            {password}
          </code>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={copy}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button autoFocus onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
