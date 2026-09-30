/**
 * Form fields. Give each field a `name` (the key the form sends) and pair it with a Label:
 *
 *   <Field label="Institution name" htmlFor="name">
 *     <Input id="name" name="name" required />
 *   </Field>
 *
 *   <Select id="type" name="type">
 *     <option value="SCHOOL">School</option>
 *   </Select>
 *
 *   <Checkbox name="permissions" value="access.user.view" label="See users" />
 */
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';

const fieldStyles =
  'flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('text-sm font-medium leading-none', className)} {...props} />;
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(fieldStyles, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(fieldStyles, 'pr-8', className)} {...props} />;
}

/** A label above a field, with an optional hint below it. */
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** A checkbox with its text on the right. */
export function Checkbox({
  label,
  description,
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'type'> & { label: string; description?: string }) {
  return (
    <label className={cn('flex items-start gap-2 text-sm', className)}>
      <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" {...props} />
      <span>
        {label}
        {description && <span className="block text-xs text-muted-foreground">{description}</span>}
      </span>
    </label>
  );
}
