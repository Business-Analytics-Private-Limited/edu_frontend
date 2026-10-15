/**
 * /students/promote: move a branch's students on to the next academic year (ADR-0030).
 *   1. the branch and the two years (a normal form: ?branchId=&fromYearId=&toYearId=). They
 *      start on the current year (or the one that includes today) and the next later year, so
 *      the students show at once; with no later year, it says to add one first;
 *   2. the board (promotion-board.tsx): each section with its students to tick (all at first:
 *      the whole section), and where they go: the SUGGESTED section in the new year (Junior →
 *      Senior, Class 9 → Class 10, same group / stream, same section code) or "Complete" after
 *      the final year. Unticked students stay where they are;
 *   3. promote. Nothing is overwritten: last year's placements stay.
 * Below: the branch's recent promotions; one can be undone while nothing changed since.
 * Moving ONE student to another section or branch during the year is "Shuffle", on the
 * student's page. Needs "students.enrolment.promote" at the branch (a Principal has it).
 */
import {
  ActionForm,
  Badge,
  Button,
  EmptyState,
  Field,
  PageHeader,
  Select,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import type { ReactNode } from 'react';
import { api, errorMessage } from '../../../../lib/api';
import { can, getMe } from '../../../../lib/me';
import { branchesForWork } from '../../../../lib/places';
import type { AcademicYear, Branch, PromotionPreview, PromotionRun } from '../../../../lib/types';
import { applyPromotion, undoPromotion } from '../actions';
import { PromotionBoard } from './promotion-board';

export default async function PromotePage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string; fromYearId?: string; toYearId?: string }>;
}) {
  const params = await searchParams;
  const me = await getMe();
  const [allBranches, years] = await Promise.all([
    can(me, 'platform.branch.view') ? api<Branch[]>('/branches') : [],
    can(me, 'academic.year.view') ? api<AcademicYear[]>('/academic-years') : [],
  ]);
  const branches = branchesForWork(me, allBranches, 'students.enrolment.promote');
  const back = { href: '/students', label: 'Back to students' };
  if (branches.length === 0) {
    return (
      <>
        <PageHeader back={back} title="Promote students" />
        <EmptyState
          icon={<ArrowUpRight />}
          title="Nothing to promote here"
          description="Your roles don't allow promoting students at any branch (a Principal can)."
        />
      </>
    );
  }

  // Defaults: the current year (or the one that includes today) and the next later one.
  const today = new Date().toISOString().slice(0, 10);
  const byStart = [...years].sort((a, b) => a.startsOn.localeCompare(b.startsOn));
  const thisYear =
    byStart.find((y) => y.status === 'ACTIVE') ??
    byStart.find((y) => y.startsOn.slice(0, 10) <= today && today <= y.endsOn.slice(0, 10)) ??
    byStart[0];
  const branchId = params.branchId || branches[0].id;
  const fromYear = byStart.find((y) => y.id === params.fromYearId) ?? thisYear;
  const laterYears = fromYear
    ? byStart.filter((y) => y.startsOn > fromYear.startsOn && y.status !== 'CLOSED')
    : [];
  const toYear = laterYears.find((y) => y.id === params.toYearId) ?? laterYears[0];

  let preview: PromotionPreview | null = null;
  let problem: string | null = null;
  if (fromYear && toYear) {
    try {
      preview = await api<PromotionPreview>(
        `/promotions/preview?${new URLSearchParams({ branchId, fromYearId: fromYear.id, toYearId: toYear.id })}`,
      );
    } catch (error) {
      unstable_rethrow(error); // Next.js redirects (session ended, no access) go on
      problem = errorMessage(error);
    }
  }
  const runs = await api<PromotionRun[]>(`/promotions?${new URLSearchParams({ branchId })}`);

  return (
    <>
      <PageHeader
        back={back}
        title="Promote students"
        description="Move students on to the next academic year: a whole section at once, or only the students you tick. To move one student during the year, use Shuffle on their page."
      />

      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4 shadow-sm [&>[data-field]]:w-full sm:[&>[data-field]]:w-auto">
        <Field label="Branch" htmlFor="branchId">
          <Select id="branchId" name="branchId" defaultValue={branchId} className="w-full sm:w-56">
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="From year" htmlFor="fromYearId">
          <Select
            id="fromYearId"
            name="fromYearId"
            defaultValue={fromYear?.id}
            className="w-full sm:w-44"
          >
            {byStart.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
                {y.status === 'ACTIVE' ? ' · current' : ''}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="To year" htmlFor="toYearId">
          <Select
            id="toYearId"
            name="toYearId"
            defaultValue={toYear?.id}
            className="w-full sm:w-44"
          >
            {laterYears.length === 0 && <option value="">No later year</option>}
            {laterYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" variant="outline">
          Show students
        </Button>
      </form>

      {!fromYear && (
        <Notice>
          There are no academic years yet.{' '}
          <Link href="/academic/years" className="font-medium underline">
            Add one
          </Link>{' '}
          first.
        </Notice>
      )}
      {fromYear && !toYear && (
        <Notice>
          There is no academic year after {fromYear.name} to promote into.{' '}
          <Link href="/academic/years" className="font-medium underline">
            Add the next year
          </Link>{' '}
          (e.g. {nextYearName(fromYear.name)}) in Academic years, then come back.
        </Notice>
      )}
      {problem && <Notice>{problem}</Notice>}

      {preview && (
        <ActionForm
          action={applyPromotion}
          submitLabel="Promote"
          ownButtons
          confirmMessage={`Promote the selected students from ${preview.fromYear.name} to ${preview.toYear.name}? Their ${preview.fromYear.name} placements stay in the history, and this can be undone below.`}
          className="gap-4"
        >
          <input type="hidden" name="branchId" value={preview.branch.id} />
          <input type="hidden" name="fromYearId" value={preview.fromYear.id} />
          <input type="hidden" name="toYearId" value={preview.toYear.id} />
          <PromotionBoard preview={preview} />
        </ActionForm>
      )}

      {runs.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 text-lg font-semibold">Recent promotions at this branch</h2>
          <Table>
            <TableHead>
              <tr>
                <Th>When</Th>
                <Th>From → to</Th>
                <Th>Promoted</Th>
                <Th>Completed</Th>
                <Th />
              </tr>
            </TableHead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id}>
                  <Td className="text-muted-foreground">
                    {new Date(run.createdAt).toLocaleString()}
                  </Td>
                  <Td>
                    {run.fromYear} → {run.toYear}
                  </Td>
                  <Td>{run.promoted}</Td>
                  <Td>{run.completed}</Td>
                  <Td className="text-right">
                    {run.undoneAt ? (
                      <Badge variant="outline">
                        Undone {new Date(run.undoneAt).toLocaleDateString()}
                      </Badge>
                    ) : (
                      <ActionForm
                        action={undoPromotion.bind(null, run.id)}
                        submitLabel="Undo"
                        pendingLabel="Undoing…"
                        confirmMessage={`Undo the promotion ${run.fromYear} → ${run.toYear}? Students go back to their ${run.fromYear} sections.`}
                        submitVariant="outline"
                        submitSize="sm"
                      />
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </>
  );
}

/** "2026-27" -> "2027-28" (a hint only). */
function nextYearName(name: string): string {
  const m = name.match(/^(\d{4})-(\d{2})$/);
  return m
    ? `${Number(m[1]) + 1}-${String((Number(m[2]) + 1) % 100).padStart(2, '0')}`
    : 'the next year';
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="mb-6 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
      {children}
    </p>
  );
}
