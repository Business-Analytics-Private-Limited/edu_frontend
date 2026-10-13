'use client';
/**
 * "Add course" for Degree / Engineering colleges (ADR-0033):
 *
 *   Course  [B.Com]   Code [BCOM]
 *   Specializations?  ( No: the course has its own years )  ( Yes: e.g. CSE, ECE )
 *   Years   [3]       (only with "No")
 *
 * "No": the course gets 1st Year ... Nth Year straight away. "Yes": it is added without years,
 * and each specialization added next brings its own years.
 */
import { ActionForm, Field, Input, Select } from '@eduplatform/ui';
import { useState } from 'react';
import { addCourse } from '../actions';

export function AddCourseForm({ defaultYears }: { defaultYears: number }) {
  const [withSpecializations, setWithSpecializations] = useState(false);
  return (
    <ActionForm action={addCourse} submitLabel="Add course" resetOnSuccess>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Course *" htmlFor="courseName">
          <Input id="courseName" name="name" required maxLength={100} placeholder="e.g. B.Com" />
        </Field>
        <Field label="Code *" htmlFor="courseCode" hint="Short, e.g. BCOM">
          <Input
            id="courseCode"
            name="code"
            required
            maxLength={20}
            pattern="[A-Za-z0-9_\-]+"
            title="Letters, digits, _ and - only"
            placeholder="BCOM"
          />
        </Field>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Specializations?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              [false, 'No', 'The course has its own years (e.g. B.Com, BBA)'],
              [true, 'Yes', 'Each specialization has its own years (e.g. B.Tech: CSE, ECE)'],
            ] as const
          ).map(([value, title, hint]) => (
            <label
              key={title}
              className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 text-sm transition-colors ${
                withSpecializations === value
                  ? 'border-primary bg-accent/60 ring-2 ring-primary/20'
                  : 'hover:bg-muted/40'
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                <input
                  type="radio"
                  name="specializations"
                  value={value ? 'yes' : 'no'}
                  checked={withSpecializations === value}
                  onChange={() => setWithSpecializations(value)}
                  className="size-4 accent-[var(--primary)]"
                />
                {title}
              </span>
              <span className="pl-6 text-xs text-muted-foreground">{hint}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {!withSpecializations && (
        <Field label="Years of study *" htmlFor="courseYears" hint="1st Year … the final year">
          <Select
            id="courseYears"
            name="years"
            defaultValue={String(defaultYears)}
            className="sm:w-40"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'year' : 'years'}
              </option>
            ))}
          </Select>
        </Field>
      )}
    </ActionForm>
  );
}
