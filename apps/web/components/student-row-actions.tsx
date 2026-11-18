/**
 * The icons at the end of a student row (Students list, Top rankers): the eye opens the student,
 * the pencil opens "Edit student" (only shown where the user may edit students; the API checks
 * again).
 */
import { Eye, Pencil } from 'lucide-react';
import Link from 'next/link';

/** The eye (open the student) and, where allowed, the pencil (edit their details). */
export function RowActions({ id, canEdit }: { id: string; canEdit: boolean }) {
  const icon =
    'inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground';
  return (
    <span className="inline-flex gap-1">
      <Link href={`/students/${id}`} className={icon} title="View" aria-label="View">
        <Eye className="size-4" />
      </Link>
      {canEdit && (
        <Link href={`/students/${id}/edit`} className={icon} title="Edit" aria-label="Edit">
          <Pencil className="size-4" />
        </Link>
      )}
    </span>
  );
}
