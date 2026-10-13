/**
 * /students/promote: move a branch's students on to the next academic year (ADR-0030).
 *   1. choose the branch and the two years (a normal form: ?branchId=&fromYearId=&toYearId=);
 *   2. the preview shows each section with its students and a SUGGESTED section in the new year:
 *      the year's "next" (Junior → Senior, Class 9 → Class 10), same group / stream, same section
 *      code; or "Complete" after the final year (Class 10, Senior, Long Term, final year);
 *   3. change any choice and apply. Nothing is overwritten: last year's placements stay.
 * Below: the branch's recent promotions; one can be undone while nothing changed since.
 * Needs "students.enrolment.promote" at the branch (a Principal has it).
 */
import {
  ActionForm,
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  Field,
  PageHeader,
  Select,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import { can, getMe } from '../../../../lib/me';
import { branchesForWork } from '../../../../lib/places';
import type { AcademicYear, Branch, PromotionPreview, PromotionRun } from '../../../../lib/types';
import { applyPromotion, undoPromotion } from '../actions';

export default async function PromotePage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string; fromYearId?: string; toYearId?: string }>;
}) {
  const { branchId = '', fromYearId = '', toYearId = '' } = await searchParams;
  const me = await getMe();
  const [allBranches, years] = await Promise.all([
    can(me, 'platform.branch.view') ? api<Branch[]>('/branches') : [],
    can(me, 'academic.year.view') ? api<AcademicYear[]>('/academic-years') : [],
  ]);
  const branches = branchesForWork(me, allBranches, 'students.enrolment.promote');
  const ready = branchId && fromYearId && toYearId;
  const preview = ready
    ? await api<PromotionPreview>(
        `/promotions/preview?${new URLSearchParams({ branchId, fromYearId, toYearId })}`,
      )
    : null;
  const total = preview?.rows.reduce((n, r) => n + r.students.length, 0) ?? 0;
  const runs = branchId
    ? await api<PromotionRun[]>(`/promotions?${new URLSearchParams({ branchId })}`)
    : [];

  return (
    <>
      <PageHeader
        back={{ href: '/students', label: 'Back to students' }}
        title="Promote students"
        description="Move a branch's students on to the next academic year, section by section."
      />

      <form className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Branch" htmlFor="branchId">
          <Select
            id="branchId"
            name="branchId"
            defaultValue={branchId}
            required
            className="w-full sm:w-56"
          >
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
            defaultValue={fromYearId}
            required
            className="w-full sm:w-52"
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="To year" htmlFor="toYearId">
          <Select
            id="toYearId"
            name="toYearId"
            defaultValue={toYearId}
            required
            className="w-full sm:w-52"
          >
            {years
              .filter((y) => y.status !== 'CLOSED')
              .map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
          </Select>
        </Field>
        <Button type="submit" variant="outline">
          Preview
        </Button>
      </form>

      {preview && (
        <ActionForm
          action={applyPromotion}
          submitLabel={`Promote ${total} student(s)`}
          pendingLabel="Promoting…"
          confirmMessage={`Promote these students from ${preview.fromYear.name} to ${preview.toYear.name}?`}
          className="gap-6"
        >
          <input type="hidden" name="branchId" value={preview.branch.id} />
          <input type="hidden" name="fromYearId" value={preview.fromYear.id} />
          <input type="hidden" name="toYearId" value={preview.toYear.id} />

          <Table>
            <TableHead>
              <tr>
                <Th>{preview.fromYear.name}</Th>
                <Th>Students</Th>
                <Th>{preview.toYear.name}</Th>
              </tr>
            </TableHead>
            <tbody>
              {preview.rows.map((row) => {
                const suggested =
                  row.suggestion.kind === 'section'
                    ? `section:${row.suggestion.sectionId}`
                    : row.suggestion.kind === 'complete'
                      ? 'complete'
                      : 'skip';
                return (
                  <tr key={row.from.id}>
                    <Td className="font-medium">{row.from.label}</Td>
                    <Td>
                      <details>
                        <summary className="cursor-pointer">
                          {row.students.length} student(s)
                          {row.alreadyPlaced > 0 && (
                            <span className="text-muted-foreground">
                              {' '}
                              · {row.alreadyPlaced} already placed
                            </span>
                          )}
                        </summary>
                        <ul className="mt-1 text-xs text-muted-foreground">
                          {row.students.map((s) => (
                            <li key={s.id}>
                              {s.rollNo ? `#${s.rollNo} ` : ''}
                              {s.fullName} ({s.admissionNo})
                            </li>
                          ))}
                        </ul>
                      </details>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap items-center gap-2">
                        <Select
                          name={`to_${row.from.id}`}
                          defaultValue={suggested}
                          className="w-full sm:w-72"
                          aria-label={`Where ${row.from.label} goes`}
                        >
                          {preview.sections.map((s) => (
                            <option key={s.id} value={`section:${s.id}`}>
                              {s.label}
                            </option>
                          ))}
                          <option value="complete">Complete (become outgoing)</option>
                          <option value="skip">Don&apos;t promote</option>
                        </Select>
                        {row.suggestion.kind === 'choose' && (
                          <Badge variant="warning">choose</Badge>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
              {preview.rows.length === 0 && (
                <tr>
                  <Td colSpan={3} className="py-8 text-center text-muted-foreground">
                    No current students in {preview.fromYear.name} at this branch.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>

          <Card className="max-w-xl">
            <CardContent className="flex flex-col gap-4 pt-6">
              <Checkbox name="keepRollNumbers" label="Keep each student's roll number" />
            </CardContent>
          </Card>
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
