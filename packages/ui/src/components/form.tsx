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
 *
 *   <FileInput id="file" name="file" accept=".csv" />
 */
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';

const fieldStyles =
  'flex h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm shadow-sm transition-[color,box-shadow,border-color] placeholder:text-muted-foreground hover:border-ring/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-muted/50 sm:h-9';

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('text-sm font-medium leading-none', className)} {...props} />;
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(fieldStyles, className)} {...props} />;
}

/**
 * A file field that looks like the other fields, with a "Choose file" button inside:
 *   <FileInput id="file" name="file" accept=".csv" required />
 */
export function FileInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  return (
    <input
      type="file"
      className={cn(
        fieldStyles,
        'h-10 cursor-pointer items-center py-1 pl-1 text-muted-foreground',
        'file:mr-3 file:h-8 file:cursor-pointer file:rounded file:border-0 file:bg-primary file:px-3 file:text-sm file:font-medium file:text-primary-foreground hover:file:opacity-90',
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(fieldStyles, 'pr-8', className)} {...props} />;
}

/**
 * A label above a field, with an optional hint below it, and an optional icon inside the field
 * on the left. Inside an ActionForm, the field's problem appears under it (data-field; the text
 * comes from the browser's checks, see action-form.tsx and styles.css).
 */
export function Field({
  label,
  htmlFor,
  hint,
  icon,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  /** e.g. <Phone /> from lucide-react, shown inside the input on the left. */
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div data-field className={cn('ep-field flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {icon ? (
        <div className="relative [&_input]:pl-9 [&_select]:pl-9">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground [&_svg]:size-4">
            {icon}
          </span>
          {children}
        </div>
      ) : (
        children
      )}
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
