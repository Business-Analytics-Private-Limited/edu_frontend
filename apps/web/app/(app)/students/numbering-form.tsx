/**
 * The admission-number switch (ADR-0030, ADR-0031), on Student settings and on the import page:
 *   Automatic ON  = numbers from the pattern; the import sheet has NO admissionNo column;
 *   Automatic OFF = numbers are typed in the form and in the sheet's admissionNo column.
 * For the whole organization ("students.settings.update" there); the API checks it again.
 */
import { ActionForm, Field, Input, Select } from '@eduplatform/ui';
import type { OwnOrganization } from '../../../lib/types';
import { setNumbering } from './actions';

export function NumberingForm({ organization }: { organization: OwnOrganization }) {
  return (
    <ActionForm action={setNumbering} submitLabel="Save">
      <Field label="Automatic admission numbers" htmlFor="mode">
        <Select id="mode" name="mode" defaultValue={organization.admissionNumbering}>
          <option value="AUTOMATIC">On: automatic, from a pattern</option>
          <option value="MANUAL">Off: typed in the form and the import sheet</option>
        </Select>
      </Field>
      <Field
        label="Pattern (when on)"
        htmlFor="pattern"
        hint={`{CODE} = ${organization.code}, {BRANCH} = branch code (a counter per branch), {YY} or {YYYY} = year (restarts every year), {SEQ:4} = running number`}
      >
        <Input
          id="pattern"
          name="pattern"
          maxLength={40}
          defaultValue={organization.admissionNoPattern ?? ''}
          placeholder="{CODE}{YY}{SEQ:4}"
        />
      </Field>
    </ActionForm>
  );
}
