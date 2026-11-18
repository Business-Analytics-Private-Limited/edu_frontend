/**
 * Students as cards, for phones (the Students list and Top rankers show a table from medium
 * screens up, and these cards below that):
 *
 *   ┌─────────────────────────────────────┐
 *   │ (KS)  K. Sai Charan ★     Current   │
 *   │       ASC260001 · NAD               │
 *   │       Junior › MPC › JEE Mains › A  │
 *   │                          👁  ✎      │
 *   └─────────────────────────────────────┘
 *
 *   <StudentCards students={result.items} canEdit={(s) => canAt(me, '…', { branchId: s.branch.id })}
 *                 extra={(s) => <Badge>Expert</Badge>} />
 */
import { Badge } from '@eduplatform/ui';
import { Star } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { STUDENT_STATUSES } from '../app/(app)/students/labels';
import type { StudentListItem } from '../lib/types';
import { RowActions } from './student-row-actions';

export function StudentCards({
  students,
  editable,
  extra,
  empty = 'No students found.',
}: {
  students: StudentListItem[];
  /** Ids of the students the user may edit (the pencil). */
  editable: Set<string>;
  /** Something more on each card, e.g. the learner level. */
  extra?: (student: StudentListItem) => ReactNode;
  empty?: string;
}) {
  if (students.length === 0) {
    return (
      <p className="rounded-xl border bg-card py-8 text-center text-sm text-muted-foreground">
        {empty}
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {students.map((s) => {
        const initials = s.fullName
          .split(/\s+/)
          .filter((w) => /[A-Za-z]/.test(w[0] ?? ''))
          .slice(0, 2)
          .map((w) => w[0]!.toUpperCase())
          .join('');
        return (
          <li key={s.id} className="flex gap-3 rounded-xl border bg-card p-3 shadow-sm">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-highlight text-sm font-semibold text-white">
              {initials || '?'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/students/${s.id}`}
                  className="min-w-0 font-medium leading-snug text-primary hover:underline"
                >
                  {s.fullName}
                  {s.surname ? ` ${s.surname}` : ''}
                  {s.topRanker && (
                    <Star
                      className="ml-1 inline size-3.5 fill-amber-400 text-amber-500"
                      aria-label="Top ranker"
                    />
                  )}
                </Link>
                <Badge variant={s.status === 'ACTIVE' ? 'success' : 'outline'} className="shrink-0">
                  {STUDENT_STATUSES[s.status]}
                </Badge>
              </div>
              <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                {s.admissionNo} · {s.branch.name}
              </p>
              <p className="mt-1 text-sm">
                {s.placement ? (
                  <>
                    {s.placement.section}
                    <span className="ml-1 text-xs text-muted-foreground">
                      {s.placement.academicYear.name}
                      {s.placement.rollNo ? ` · #${s.placement.rollNo}` : ''}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Not placed</span>
                )}
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div>{extra?.(s)}</div>
                <RowActions id={s.id} canEdit={editable.has(s.id)} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
