'use client';
/**
 * The promotion board (ADR-0030): one card per section of the "from" year, with its students as
 * profiles to tick. All are ticked at first (the whole section goes); untick a student to hold
 * them back, or use the section's box to tick / untick everyone. Each section has its own
 * "move to": the suggested section of the NEXT year is chosen at first; the list is grouped by
 * year (next year first, then the same year = repeat); "Complete" after the final year.
 *
 * When the next year has no matching section at this branch yet, the card says so and offers
 * "Add section" right there (a slide-in panel, pre-filled with the same name and code); once
 * added, it is suggested by itself. Only for users who may add sections at the branch
 * (`canAddSections`, "academic.structure.create"); others are told who can. When the next year
 * lacks even the matching group or stream (nothing to put a section under), the card says so
 * and links to Academic → Structure.
 *
 * The form sends, per section: to_<sectionId> = "section:<id>" | "complete", and
 * students_<sectionId> = each ticked student's id (see applyPromotion in ../actions.ts).
 * The page re-creates this board (a `key`) whenever the students change (after a promotion or
 * an undo), so the ticks always match what is shown. A target the user didn't change follows
 * the suggestion, so "Add section" updates that card and leaves every other choice alone.
 */
import {
  ActionForm,
  Badge,
  Button,
  cn,
  Drawer,
  Field,
  Input,
  Select,
  useActionFormPending,
} from '@eduplatform/ui';
import { ArrowRight, Check, GraduationCap, Loader2, Plus, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { PromotionPreview } from '../../../../lib/types';
import { addNextYearSection } from '../actions';

type Row = PromotionPreview['rows'][number];

export function PromotionBoard({
  preview,
  canAddSections,
}: {
  preview: PromotionPreview;
  canAddSections: boolean;
}) {
  const pending = useActionFormPending();
  const [chosen, setChosen] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(preview.rows.map((r) => [r.from.id, r.students.map((s) => s.id)])),
  );
  // Only the targets the user changed; the others follow the suggestion.
  const [targets, setTargets] = useState<Record<string, string>>({});
  // Only students still shown count (never ones already moved).
  const pickedOf = (row: Row) => {
    const shown = new Set(row.students.map((s) => s.id));
    return (chosen[row.from.id] ?? []).filter((id) => shown.has(id));
  };
  const total = preview.rows.reduce((n, row) => n + pickedOf(row).length, 0);
  const sectionsWithStudents = preview.rows.filter((row) => pickedOf(row).length > 0).length;

  const toggle = (sectionId: string, studentId: string) =>
    setChosen((c) => ({
      ...c,
      [sectionId]: (c[sectionId] ?? []).includes(studentId)
        ? (c[sectionId] ?? []).filter((id) => id !== studentId)
        : [...(c[sectionId] ?? []), studentId],
    }));
  const toggleAll = (row: Row) => {
    const all = row.students.map((s) => s.id);
    setChosen((c) => ({ ...c, [row.from.id]: pickedOf(row).length === all.length ? [] : all }));
  };

  if (preview.rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed bg-card py-10 text-center text-sm text-muted-foreground">
        No current students in {preview.fromYear.name} at {preview.branch.name} (or all of them are
        already placed in {preview.toYear.name}).
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {preview.rows.map((row) => {
        const all = row.students.map((s) => s.id);
        const picked = pickedOf(row);
        const target = targets[row.from.id] ?? suggested(row);
        const missingNext = row.suggestion.kind === 'choose' && row.nextPlace;
        return (
          <section key={row.from.id} className="min-w-0 rounded-2xl border bg-card shadow-sm">
            <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={all.length > 0 && picked.length === all.length}
                  ref={(el) => {
                    if (el) el.indeterminate = picked.length > 0 && picked.length < all.length;
                  }}
                  onChange={() => toggleAll(row)}
                  disabled={all.length === 0}
                  aria-label={`Select all of ${row.from.label}`}
                  className="size-4 shrink-0 accent-[var(--primary)]"
                />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{row.from.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {picked.length} of {all.length} selected
                    {row.alreadyPlaced > 0 &&
                      ` · ${row.alreadyPlaced} already in ${preview.toYear.name}`}
                  </span>
                </span>
              </label>
              <div data-field className="ep-field flex w-full flex-col gap-1 sm:w-auto">
                <div className="flex items-center gap-2">
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  <Select
                    name={`to_${row.from.id}`}
                    value={target}
                    onChange={(e) =>
                      setTargets((t) => ({ ...t, [row.from.id]: e.currentTarget.value }))
                    }
                    required={picked.length > 0}
                    aria-label={`Where ${row.from.label} goes in ${preview.toYear.name}`}
                    className="min-w-0 sm:w-[28rem]"
                  >
                    <option value="">Choose where they go…</option>
                    {targetGroups(preview, row).map((group) => (
                      <optgroup key={group.key} label={group.label}>
                        {group.sections.map((s) => (
                          <option key={s.id} value={`section:${s.id}`}>
                            {s.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    <optgroup label="Finished">
                      <option value="complete">Complete (finished: become outgoing)</option>
                    </optgroup>
                  </Select>
                  {row.suggestion.kind === 'choose' && !target && (
                    <Badge variant="warning">choose</Badge>
                  )}
                </div>
              </div>
            </div>

            {missingNext && (
              <div className="flex flex-wrap items-center gap-3 border-b bg-warning/10 px-4 py-2.5 text-sm">
                <TriangleAlert className="size-4 shrink-0 text-warning" />
                <span className="min-w-0 flex-1">
                  {preview.branch.name} has no section in{' '}
                  <span className="font-medium">{row.nextPlace!.label}</span> yet, so there is no
                  section to move them into.
                </span>
                {!canAddSections ? (
                  <span className="w-full text-xs text-muted-foreground sm:w-auto">
                    Ask someone who manages the academic structure to add it (Academic → Sections).
                  </span>
                ) : (
                  <Drawer
                    title="Add a section for next year"
                    description={`At ${preview.branch.name}, under ${row.nextPlace!.label}. The same code (${row.section.code}) makes it the suggested target, now and every year.`}
                    trigger={
                      <>
                        <Plus /> Add section
                      </>
                    }
                    triggerSize="sm"
                  >
                    <ActionForm
                      action={addNextYearSection.bind(null, preview.branch.id, row.nextPlace!.id)}
                      submitLabel="Add section"
                    >
                      <Field label="Under" htmlFor={`under-${row.from.id}`}>
                        <Input id={`under-${row.from.id}`} value={row.nextPlace!.label} readOnly />
                      </Field>
                      <Field label="Name *" htmlFor={`name-${row.from.id}`}>
                        <Input
                          id={`name-${row.from.id}`}
                          name="name"
                          required
                          maxLength={100}
                          defaultValue={row.section.name}
                        />
                      </Field>
                      <Field
                        label="Code *"
                        htmlFor={`code-${row.from.id}`}
                        hint="Keep the same code so promotion finds it by itself"
                      >
                        <Input
                          id={`code-${row.from.id}`}
                          name="code"
                          required
                          maxLength={20}
                          pattern="[A-Za-z0-9_\-]+"
                          title="Letters, digits, _ and - only"
                          defaultValue={row.section.code}
                        />
                      </Field>
                    </ActionForm>
                  </Drawer>
                )}
              </div>
            )}
            {row.suggestion.kind === 'choose' && !row.nextPlace && row.nextYearClassId && (
              <div className="flex items-center gap-3 border-b bg-warning/10 px-4 py-2.5 text-sm">
                <TriangleAlert className="size-4 shrink-0 text-warning" />
                <span className="min-w-0 flex-1">
                  The next year has no matching group or stream for this section in the academic
                  structure, so nothing is suggested. Choose where they go, or add it in{' '}
                  <Link href="/academic/structure" className="font-medium underline">
                    Academic → Structure
                  </Link>
                  .
                </span>
              </div>
            )}

            <ul className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
              {row.students.map((s) => {
                const on = picked.includes(s.id);
                return (
                  <li key={s.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition-colors',
                        on ? 'border-primary/40 bg-accent/50' : 'opacity-70 hover:bg-muted/40',
                      )}
                    >
                      <input
                        type="checkbox"
                        name={`students_${row.from.id}`}
                        value={s.id}
                        checked={on}
                        onChange={() => toggle(row.from.id, s.id)}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold [&_svg]:size-4',
                          on
                            ? 'bg-linear-to-br from-primary to-highlight text-white'
                            : 'border bg-muted text-muted-foreground',
                        )}
                      >
                        {on ? <Check /> : initials(s.fullName)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{s.fullName}</span>
                        <span className="block truncate font-mono text-xs text-muted-foreground">
                          {s.admissionNo}
                          {s.rollNo ? ` · #${s.rollNo}` : ''}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {/* Always in reach: how many are selected, and the button. */}
      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-medium">
            <GraduationCap className="mr-1 inline size-4 text-primary" />
            {total} student(s) selected in {sectionsWithStudents} section(s)
          </span>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              name="keepRollNumbers"
              className="size-3.5 accent-[var(--primary)]"
            />
            Keep each student&apos;s roll number
          </label>
        </div>
        <Button
          type="submit"
          disabled={pending || total === 0}
          className="bg-linear-to-r from-primary to-highlight shadow-lg shadow-primary/25"
        >
          {pending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
          {pending ? 'Promoting…' : `Promote ${total} student(s) to ${preview.toYear.name}`}
        </Button>
      </div>
    </div>
  );
}

/** The suggestion as a list value: "section:<id>", "complete" or "" (choose). */
function suggested(row: Row): string {
  if (row.suggestion.kind === 'section') return `section:${row.suggestion.sectionId}`;
  return row.suggestion.kind === 'complete' ? 'complete' : '';
}

/**
 * The target sections grouped by year, for one row: the next year first, then the row's own
 * year (= repeat the year), then any others.
 */
function targetGroups(preview: PromotionPreview, row: Row) {
  const byYear = new Map<string, { label: string; sections: PromotionPreview['sections'] }>();
  for (const s of preview.sections) {
    const key = s.yearClassId ?? 'other';
    const group = byYear.get(key) ?? { label: s.yearLabel || 'Other', sections: [] };
    group.sections.push(s);
    byYear.set(key, group);
  }
  const rank = (key: string) => (key === row.nextYearClassId ? 0 : key === row.yearClassId ? 1 : 2);
  return [...byYear.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([key, group]) => ({
      key,
      sections: group.sections,
      label:
        key === row.nextYearClassId
          ? `Next year: ${group.label}`
          : key === row.yearClassId
            ? `Same year (repeat): ${group.label}`
            : group.label,
    }));
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter((w) => /[A-Za-z]/.test(w[0] ?? ''))
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || '?'
  );
}
