'use client';
/**
 * A filter form (a normal GET form) that loads as soon as one of its lists changes, so nobody
 * has to find the button after choosing a branch or a year. The button stays for keyboards.
 *
 *   <AutoSubmitForm className="…"><Select name="branchId">…</Select><Button type="submit">Show</Button></AutoSubmitForm>
 */
import type { ReactNode } from 'react';

export function AutoSubmitForm({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <form
      className={className}
      onChange={(event) => {
        if (event.target instanceof HTMLSelectElement) event.currentTarget.requestSubmit();
      }}
    >
      {children}
    </form>
  );
}
