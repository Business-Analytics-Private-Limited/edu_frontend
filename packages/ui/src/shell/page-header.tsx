/**
 * The title block at the top of a page, with optional actions on the right and an optional
 * "← Back to …" link above the title.
 *
 *   <PageHeader title="Students" description="All students of the institution"
 *               actions={<Button>Admit student</Button>} />
 *
 *   <PageHeader title={student.name} back={{ href: '/students', label: 'Back to students' }} />
 *
 * Use `back` on every page that is opened from another page (a detail, "new" or settings page).
 * Pages in the menu without a parent page don't need it.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Where "back" goes, e.g. { href: '/students', label: 'Back to students' }. */
  back?: { href: string; label: string };
}

export function PageHeader({ title, description, actions, back }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <span aria-hidden="true">←</span>
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
