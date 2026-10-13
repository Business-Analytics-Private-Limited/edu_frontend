/**
 * A message box, e.g. after saving a form.
 *
 *   <Alert variant="error">Email or password is wrong</Alert>
 *   <Alert variant="success">Institution added</Alert>
 */
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

const styles = {
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  success: 'border-success/30 bg-success/10 text-success',
  info: 'border-border bg-muted text-foreground',
};

export function Alert({
  variant = 'info',
  children,
}: {
  variant?: keyof typeof styles;
  children: ReactNode;
}) {
  return (
    <div
      role="alert"
      className={cn('break-words rounded-md border px-3 py-2 text-sm', styles[variant])}
    >
      {children}
    </div>
  );
}
