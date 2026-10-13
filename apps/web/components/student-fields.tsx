'use client';
/**
 * A student's own details, grouped, for the "Add student" and "Edit student" forms (ADR-0031).
 * The browser checks each field before sending (required, lengths, patterns, the Aadhaar check
 * digit, a pickup point when the bus is ticked); the API checks the same rules again.
 *
 *   <ActionForm action={admitStudent} submitLabel="Add student">
 *     <StudentFields showSensitive />
 *   </ActionForm>
 *
 *   <StudentFields defaults={student} showSensitive={student.sensitiveVisible}
 *                  admittedOn={student.admissionDate.slice(0, 10)} />
 *
 * Sensitive details (Aadhaar, category, sub-caste, medical condition) are only shown when
 * `showSensitive`; the form then also sends "sensitiveShown", so an edit without them leaves the
 * stored values alone.
 */
import { Checkbox, Field, Input, Select } from '@eduplatform/ui';
import { useState, type ReactNode } from 'react';
import {
  BLOOD_GROUPS,
  BOARDS,
  CATEGORIES,
  GENDERS,
  LEARNER_LEVELS,
  RESIDENCES,
} from '../app/(app)/students/labels';
import {
  birthDateRange,
  CODE_PATTERN,
  CODE_TITLE,
  isValidAadhaar,
  NAME_PATTERN,
  NAME_TITLE,
  PHONE_PATTERN,
  PHONE_TITLE,
} from '../lib/student-rules';
import type { StudentProfile } from '../lib/types';

type Defaults = Partial<
  Pick<
    StudentProfile,
    | 'fullName'
    | 'surname'
    | 'dateOfBirth'
    | 'gender'
    | 'bloodGroup'
    | 'phone'
    | 'alternatePhone'
    | 'email'
    | 'address'
    | 'permanentAddress'
    | 'area'
    | 'aadhaar'
    | 'category'
    | 'subCaste'
    | 'residence'
    | 'busFacility'
    | 'pickupPoint'
    | 'previousInstitution'
    | 'previousBoard'
    | 'hallTicketNo'
    | 'previousPercentage'
    | 'previousGrade'
    | 'admissionTestNo'
    | 'admissionTestMarks'
    | 'medicalCondition'
    | 'remarks'
    | 'topRanker'
    | 'learnerLevel'
  >
>;

/** A titled group of fields in two columns. */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-sm font-semibold text-foreground">{title}</legend>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/** <option>s for a { VALUE: 'Label' } list, with an empty first choice. */
function options(list: Record<string, string>, empty = '—') {
  return [
    <option key="" value="">
      {empty}
    </option>,
    ...Object.entries(list).map(([value, label]) => (
      <option key={value} value={value}>
        {label}
      </option>
    )),
  ];
}

export function StudentFields({
  defaults = {},
  showSensitive,
  admittedOn,
}: {
  defaults?: Defaults;
  showSensitive: boolean;
  /** YYYY-MM-DD the age is counted at (3 to 30 years); today when adding a student. */
  admittedOn?: string;
}) {
  const [bus, setBus] = useState(defaults.busFacility ?? false);
  const born = birthDateRange(admittedOn ?? new Date().toISOString().slice(0, 10));
  const d = (value: string | null | undefined) => value ?? '';

  return (
    <div className="flex flex-col gap-6">
      {showSensitive && <input type="hidden" name="sensitiveShown" value="1" />}

      <Group title="Student">
        <Field label="Full name *" htmlFor="fullName" hint="As in official records">
          <Input
            id="fullName"
            name="fullName"
            required
            minLength={2}
            maxLength={100}
            pattern={NAME_PATTERN}
            title={NAME_TITLE}
            defaultValue={d(defaults.fullName)}
          />
        </Field>
        <Field label="Surname" htmlFor="surname">
          <Input
            id="surname"
            name="surname"
            maxLength={50}
            pattern={NAME_PATTERN}
            title={NAME_TITLE}
            defaultValue={d(defaults.surname)}
          />
        </Field>
        <Field
          label="Date of birth *"
          htmlFor="dateOfBirth"
          hint="The student must be 3 to 30 years old"
        >
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            required
            min={born.min}
            max={born.max}
            defaultValue={defaults.dateOfBirth?.slice(0, 10)}
          />
        </Field>
        <Field label="Gender *" htmlFor="gender">
          <Select id="gender" name="gender" required defaultValue={d(defaults.gender)}>
            {options(GENDERS, 'Choose…')}
          </Select>
        </Field>
        <Field label="Blood group" htmlFor="bloodGroup">
          <Select id="bloodGroup" name="bloodGroup" defaultValue={d(defaults.bloodGroup)}>
            <option value="">—</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </Field>
      </Group>

      <Group title="Contact">
        <Field label="Phone" htmlFor="phone" hint="10-digit mobile">
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            pattern={PHONE_PATTERN}
            title={PHONE_TITLE}
            defaultValue={d(defaults.phone)}
          />
        </Field>
        <Field label="Alternate phone" htmlFor="alternatePhone">
          <Input
            id="alternatePhone"
            name="alternatePhone"
            type="tel"
            inputMode="tel"
            pattern={PHONE_PATTERN}
            title={PHONE_TITLE}
            defaultValue={d(defaults.alternatePhone)}
          />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            maxLength={100}
            defaultValue={d(defaults.email)}
          />
        </Field>
        <Field label="Area" htmlFor="area" hint="Locality, e.g. Gajuwaka">
          <Input
            id="area"
            name="area"
            minLength={2}
            maxLength={50}
            defaultValue={d(defaults.area)}
          />
        </Field>
        <Field label="Address (now)" htmlFor="address">
          <Input
            id="address"
            name="address"
            minLength={3}
            maxLength={300}
            defaultValue={d(defaults.address)}
          />
        </Field>
        <Field label="Permanent address" htmlFor="permanentAddress">
          <Input
            id="permanentAddress"
            name="permanentAddress"
            minLength={3}
            maxLength={300}
            defaultValue={d(defaults.permanentAddress)}
          />
        </Field>
      </Group>

      {showSensitive && (
        <Group title="Identity and category (sensitive)">
          <Field label="Aadhaar" htmlFor="aadhaar" hint="12 digits; spaces are fine">
            <Input
              id="aadhaar"
              name="aadhaar"
              inputMode="numeric"
              maxLength={14}
              defaultValue={d(defaults.aadhaar)}
              onChange={(e) =>
                e.currentTarget.setCustomValidity(
                  e.currentTarget.value.trim() === '' || isValidAadhaar(e.currentTarget.value)
                    ? ''
                    : 'Not a valid Aadhaar number: check the 12 digits',
                )
              }
            />
          </Field>
          <Field label="Category" htmlFor="category">
            <Select id="category" name="category" defaultValue={d(defaults.category)}>
              {options(CATEGORIES)}
            </Select>
          </Field>
          <Field label="Sub-caste" htmlFor="subCaste">
            <Input
              id="subCaste"
              name="subCaste"
              minLength={2}
              maxLength={50}
              defaultValue={d(defaults.subCaste)}
            />
          </Field>
        </Group>
      )}

      <Group title="Stay and transport">
        <Field label="Day scholar / hosteller" htmlFor="residence">
          <Select id="residence" name="residence" defaultValue={d(defaults.residence)}>
            {options(RESIDENCES)}
          </Select>
        </Field>
        <div className="flex flex-col gap-3 pt-6">
          <Checkbox
            name="busFacility"
            label="Uses the bus"
            checked={bus}
            onChange={(e) => setBus(e.currentTarget.checked)}
          />
        </div>
        {bus && (
          <Field label="Pickup point *" htmlFor="pickupPoint">
            <Input
              id="pickupPoint"
              name="pickupPoint"
              required
              minLength={2}
              maxLength={100}
              defaultValue={d(defaults.pickupPoint)}
            />
          </Field>
        )}
      </Group>

      <Group title="Previous education">
        <Field label="School / college" htmlFor="previousInstitution">
          <Input
            id="previousInstitution"
            name="previousInstitution"
            minLength={2}
            maxLength={150}
            defaultValue={d(defaults.previousInstitution)}
          />
        </Field>
        <Field label="Board" htmlFor="previousBoard">
          <Select id="previousBoard" name="previousBoard" defaultValue={d(defaults.previousBoard)}>
            {options(BOARDS)}
          </Select>
        </Field>
        <Field label="Hall ticket no" htmlFor="hallTicketNo">
          <Input
            id="hallTicketNo"
            name="hallTicketNo"
            minLength={4}
            maxLength={20}
            pattern={CODE_PATTERN}
            title={CODE_TITLE}
            defaultValue={d(defaults.hallTicketNo)}
          />
        </Field>
        <Field label="Percentage" htmlFor="previousPercentage" hint="0 to 100">
          <Input
            id="previousPercentage"
            name="previousPercentage"
            type="number"
            min={0}
            max={100}
            step="0.01"
            defaultValue={d(defaults.previousPercentage)}
          />
        </Field>
        <Field label="Grade / points" htmlFor="previousGrade" hint="e.g. 9.2 or A1">
          <Input
            id="previousGrade"
            name="previousGrade"
            maxLength={10}
            pattern="[A-Za-z0-9.+\-]+"
            title="Letters, digits, . + and - only"
            defaultValue={d(defaults.previousGrade)}
          />
        </Field>
      </Group>

      <Group title="Admission test">
        <Field label="Test no" htmlFor="admissionTestNo">
          <Input
            id="admissionTestNo"
            name="admissionTestNo"
            maxLength={30}
            pattern={CODE_PATTERN}
            title={CODE_TITLE}
            defaultValue={d(defaults.admissionTestNo)}
          />
        </Field>
        <Field label="Test marks" htmlFor="admissionTestMarks">
          <Input
            id="admissionTestMarks"
            name="admissionTestMarks"
            type="number"
            min={0}
            max={1000}
            step="0.01"
            defaultValue={d(defaults.admissionTestMarks)}
          />
        </Field>
      </Group>

      <Group title="Health and notes">
        {showSensitive && (
          <Field label="Medical condition (sensitive)" htmlFor="medicalCondition">
            <Input
              id="medicalCondition"
              name="medicalCondition"
              minLength={2}
              maxLength={500}
              placeholder="e.g. Asthma; allergic to penicillin"
              defaultValue={d(defaults.medicalCondition)}
            />
          </Field>
        )}
        <Field label="Remarks" htmlFor="remarks">
          <Input
            id="remarks"
            name="remarks"
            minLength={2}
            maxLength={500}
            defaultValue={d(defaults.remarks)}
          />
        </Field>
      </Group>

      <Group title="Top ranker">
        <div className="pt-6">
          <Checkbox
            name="topRanker"
            label="Top ranker (active)"
            defaultChecked={defaults.topRanker ?? false}
          />
        </div>
        <Field label="Learner level" htmlFor="learnerLevel">
          <Select id="learnerLevel" name="learnerLevel" defaultValue={d(defaults.learnerLevel)}>
            {options(LEARNER_LEVELS)}
          </Select>
        </Field>
      </Group>
    </div>
  );
}
