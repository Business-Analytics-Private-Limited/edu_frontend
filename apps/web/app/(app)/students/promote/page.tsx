/**
 * /students/promote: move a campus's students on to the next academic year.
 *   1. choose the campus and the two years (a normal form: ?campusId=&fromYearId=&toYearId=);
 *   2. the preview shows each section with its students and a SUGGESTED section in the new year
 *      (the next class at the top level, same path below), or "Finish (alumni)" after the last;
 *   3. change any choice, optionally move the batches to a new stage, and apply.
 * Below: the campus's recent promotions; the newest can be undone while nothing changed since.
 * Needs "students.enrolment.promote" at the campus.
 */
import {
  ActionForm,
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  Field,
  Input,
  PageHeader,
  Select,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import { can, canAt, getMe } from '../../../../lib/me';
import type {
  AcademicYear,
  Institution,
  PromotionPreview,
  PromotionRun,
} from '../../../../lib/types';
import { applyPromotion, undoPromotion } from '../actions';
import { campusesInUse } from '../../../../lib/places';

export default async function PromotePage({
  searchParams,
}: {
  searchParams: Promise<{ campusId?: string; fromYearId?: string; toYearId?: string }>;
}) {
  const { campusId = '', fromYearId = '', toYearId = '' } = await searchParams;
  const me = await getMe();
  const [institutions, years] = await Promise.all([
    can(me, 'platform.institution.view') ? api<Institution[]>('/institutions') : [],
    can(me, 'academic.year.view') ? api<AcademicYear[]>('/academic-years') : [],
  ]);
  const campuses = institutions.flatMap((i) =>
    campusesInUse(i)
      .filter((c) =>
        canAt(me, 'students.enrolment.promote', { institutionId: i.id, campusId: c.id }),
      )
      .map((c) => ({ ...c, institution: i })),
  );
  const ready = campusId && fromYearId && toYearId;
  const preview = ready
    ? await api<PromotionPreview>(
        `/promotions/preview?${new URLSearchParams({ campusId, fromYearId, toYearId })}`,
      )
    : null;
  const total = preview?.rows.reduce((n, r) => n + r.students.length, 0) ?? 0;
  const runs = campusId
    ? await api<PromotionRun[]>(`/promotions?${new URLSearchParams({ campusId })}`)
    : [];

  return (
    <>
      <PageHeader
        title="Promote students"
        description="Move a campus's students on to the next academic year, section by section."
      />

      <form className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Campus" htmlFor="campusId">
          <Select id="campusId" name="campusId" defaultValue={campusId} required className="w-56">
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.institution.code})
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
            className="w-52"
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name} ({y.institution.name})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="To year" htmlFor="toYearId">
          <Select id="toYearId" name="toYearId" defaultValue={toYearId} required className="w-52">
            {years
              .filter((y) => y.status !== 'CLOSED')
              .map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} ({y.institution.name})
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
          <input type="hidden" name="campusId" value={preview.campus.id} />
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
                    : row.suggestion.kind === 'graduate'
                      ? 'graduate'
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
                      <div className="flex items-center gap-2">
                        <Select
                          name={`to_${row.from.id}`}
                          defaultValue={suggested}
                          className="w-72"
                          aria-label={`Where ${row.from.label} goes`}
                        >
                          {preview.sections.map((s) => (
                            <option key={s.id} value={`section:${s.id}`}>
                              {s.label}
                            </option>
                          ))}
                          <option value="graduate">Finish (become alumni)</option>
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
                    No active students in {preview.fromYear.name} on this campus.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>

          <Card className="max-w-xl">
            <CardContent className="flex flex-col gap-4 pt-6">
              <Field
                label="Move their batches to the stage"
                htmlFor="batchStage"
                hint="Optional, e.g. Senior. Leave empty to keep the batches as they are."
              >
                <Input id="batchStage" name="batchStage" placeholder="Senior" />
              </Field>
              <Checkbox name="keepRollNumbers" label="Keep each student's roll number" />
            </CardContent>
          </Card>
        </ActionForm>
      )}

      {runs.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 text-lg font-semibold">Recent promotions on this campus</h2>
          <Table>
            <TableHead>
              <tr>
                <Th>When</Th>
                <Th>From → to</Th>
                <Th>Promoted</Th>
                <Th>Finished</Th>
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
                  <Td>{run.graduated}</Td>
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
