'use client';
/**
 * The promotion board (ADR-0030): one card per section of the "from" year, with its students as
 * profiles to tick. All are ticked at first (the whole section goes); untick a student to hold
 * them back, or use the section's box to tick / untick everyone. Each section has its own
 * "move to" (the suggested section is chosen at first) or "Complete" after the final year.
 *
 * The form sends, per section: to_<sectionId> = "section:<id>" | "complete", and
 * students_<sectionId> = each ticked student's id (see applyPromotion in ../actions.ts).
 */
import { Badge, Button, cn, Select, useActionFormPending } from '@eduplatform/ui';
import { ArrowRight, Check, GraduationCap, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { PromotionPreview } from '../../../../lib/types';

export function PromotionBoard({ preview }: { preview: PromotionPreview }) {
  const pending = useActionFormPending();
  const [chosen, setChosen] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(preview.rows.map((r) => [r.from.id, r.students.map((s) => s.id)])),
  );
  const [targets, setTargets] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      preview.rows.map((r) => [
        r.from.id,
        r.suggestion.kind === 'section'
          ? `section:${r.suggestion.sectionId}`
          : r.suggestion.kind === 'complete'
            ? 'complete'
            : '',
      ]),
    ),
  );
  const total = Object.values(chosen).reduce((n, ids) => n + ids.length, 0);
  const sectionsWithStudents = Object.values(chosen).filter((ids) => ids.length > 0).length;

  const toggle = (sectionId: string, studentId: string) =>
    setChosen((c) => ({
      ...c,
      [sectionId]: c[sectionId].includes(studentId)
        ? c[sectionId].filter((id) => id !== studentId)
        : [...c[sectionId], studentId],
    }));
  const toggleAll = (sectionId: string, all: string[]) =>
    setChosen((c) => ({ ...c, [sectionId]: c[sectionId].length === all.length ? [] : all }));

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
        const picked = chosen[row.from.id] ?? [];
        const target = targets[row.from.id] ?? '';
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
                  onChange={() => toggleAll(row.from.id, all)}
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
                    {preview.sections.map((s) => (
                      <option key={s.id} value={`section:${s.id}`}>
                        {s.label}
                      </option>
                    ))}
                    <option value="complete">Complete (finished: become outgoing)</option>
                  </Select>
                  {row.suggestion.kind === 'choose' && !target && (
                    <Badge variant="warning">choose</Badge>
                  )}
                </div>
              </div>
            </div>
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
