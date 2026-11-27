/**
 * The form for a grading scheme (new or edit): a name, "default" and the bands, typed one per
 * line as "grade, from %, grade point, remark" (backend ADR-0037). A text box keeps the form
 * simple and works on a phone; the server action reads and checks the lines.
 */
import { ActionForm, Checkbox, Field, Input, Textarea } from '@eduplatform/ui';
import type { GradingScheme } from '../../../../lib/types';
import { saveGradingScheme } from '../actions';

export const EXAMPLE_BANDS = [
  'A+, 90, 10, Outstanding',
  'A, 75, 9, Excellent',
  'B, 60, 8, Very good',
  'C, 50, 7, Good',
  'D, 35, 6, Pass',
  'E, 0, 0, Needs improvement',
].join('\n');

/** A scheme's bands written back as lines for the text box. */
export function bandLines(scheme: GradingScheme): string {
  return scheme.bands
    .map((b) =>
      [b.grade, b.minPercentage, b.gradePoint ?? '', b.remark ?? '']
        .map(String)
        .join(', ')
        .replace(/(, )+$/, ''),
    )
    .join('\n');
}

export function SchemeForm({ scheme }: { scheme?: GradingScheme }) {
  return (
    <ActionForm
      action={saveGradingScheme.bind(null, scheme?.id ?? null)}
      submitLabel={scheme ? 'Save' : 'Add grading scheme'}
    >
      <Field label="Name *" htmlFor="schemeName">
        <Input
          id="schemeName"
          name="name"
          required
          maxLength={100}
          defaultValue={scheme?.name}
          placeholder="CBSE-style grades"
        />
      </Field>
      <Field
        label="Grades *"
        htmlFor="bands"
        hint="One per line: grade, from %, grade point (optional), remark (optional). One grade must start at 0. Give every grade a point to show a GPA."
      >
        <Textarea
          id="bands"
          name="bands"
          rows={8}
          required
          className="font-mono"
          defaultValue={scheme ? bandLines(scheme) : EXAMPLE_BANDS}
        />
      </Field>
      {!scheme?.isDefault && (
        <Checkbox
          name="isDefault"
          label="The default"
          description="Exams without their own scheme use the default."
        />
      )}
    </ActionForm>
  );
}
