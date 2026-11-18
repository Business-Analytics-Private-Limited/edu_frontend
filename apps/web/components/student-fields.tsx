'use client';
/**
 * A student's own details, in groups, for "Add student" (one group per step of the wizard,
 * students/new/admission-wizard.tsx) and "Edit student" (all groups on one page) (ADR-0031).
 *
 *   <StudentFields defaults={student} showSensitive={student.sensitiveVisible}
 *                  admittedOn={student.admissionDate.slice(0, 10)} />        (everything)
 *
 *   <PersonalFields />  <ContactFields />  <IdentityFields />  <StayFields />
 *   <EducationFields /> <TestFields />     <HealthFields showSensitive />  <RankerFields />
 *
 * The browser checks each field before sending (required, lengths, patterns, the Aadhaar
 * check digit, a pickup point when the bus is on) and shows the problem under the field; the
 * API checks the same rules again. Sensitive details (Aadhaar, category, sub-caste, medical
 * condition) only appear with `showSensitive`; the form then also sends "sensitiveShown", so
 * an edit without them leaves the stored values alone.
 */
import { Field, Input, Select, cn } from '@eduplatform/ui';
import {
  AtSign,
  Bus,
  CalendarDays,
  Fingerprint,
  GraduationCap,
  Hash,
  HeartPulse,
  Home,
  IdCard,
  MapPin,
  Percent,
  Phone,
  School,
  Star,
  Trophy,
  User,
} from 'lucide-react';
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

export type StudentDefaults = Partial<
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

const v = (value: string | null | undefined) => value ?? '';

// --- Building blocks -----------------------------------------------------------------------------

/** A titled group of fields with an icon, in two columns from small screens up. */
export function Group({
  title,
  icon,
  description,
  children,
}: {
  title: string;
  icon?: ReactNode;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-4">
      <legend className="mb-3 flex items-center gap-2.5">
        {icon && (
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-4">
            {icon}
          </span>
        )}
        <span>
          <span className="block text-sm font-semibold text-foreground">{title}</span>
          {description && (
            <span className="block text-xs font-normal text-muted-foreground">{description}</span>
          )}
        </span>
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/**
 * Tap-to-choose options (radio buttons drawn as chips), e.g. gender or blood group. With
 * `required`, the browser asks for a choice before sending.
 */
export function ChoiceChips({
  label,
  name,
  options,
  defaultValue,
  required,
  allowNone,
  className,
}: {
  label: string;
  name: string;
  options: Record<string, string> | readonly string[];
  defaultValue?: string | null;
  required?: boolean;
  /** Adds a "—" chip that sends nothing (to clear a choice). */
  allowNone?: boolean;
  className?: string;
}) {
  const entries: [string, string][] = Array.isArray(options)
    ? options.map((o: string) => [o, o])
    : Object.entries(options);
  return (
    <div data-field className={cn('ep-field flex min-w-0 flex-col gap-1.5', className)}>
      <span className="text-sm font-medium leading-none">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {allowNone && <Chip name={name} value="" label="—" defaultChecked={!defaultValue} />}
        {entries.map(([value, text]) => (
          <Chip
            key={value}
            name={name}
            value={value}
            label={text}
            required={required}
            defaultChecked={defaultValue === value}
          />
        ))}
      </div>
    </div>
  );
}

function Chip({
  name,
  value,
  label,
  required,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  required?: boolean;
  defaultChecked?: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        required={required}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="inline-flex h-9 items-center rounded-full border border-input bg-card px-3.5 text-sm text-muted-foreground transition-all hover:border-ring/60 hover:text-foreground peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:shadow-md peer-checked:shadow-primary/25 peer-focus-visible:ring-4 peer-focus-visible:ring-ring/20">
        {label}
      </span>
    </label>
  );
}

/** An on/off switch that sends "on" like a checkbox. */
export function Switch({
  name,
  label,
  description,
  checked,
  defaultChecked,
  onChange,
}: {
  name: string;
  label: string;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (on: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-muted-foreground">{description}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={(e) => onChange?.(e.currentTarget.checked)}
        className="peer sr-only"
      />
      <span className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-input transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-ring/20" />
    </label>
  );
}

/** A 10-digit mobile field with a "+91" prefix. */
function PhoneInput({
  id,
  name,
  defaultValue,
}: {
  id: string;
  name: string;
  defaultValue?: string | null;
}) {
  return (
    <div className="flex min-w-0">
      <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-2.5 text-xs font-medium text-muted-foreground">
        +91
      </span>
      <Input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        pattern={PHONE_PATTERN}
        title={PHONE_TITLE}
        placeholder="98765 43210"
        defaultValue={v(defaultValue)}
        className="rounded-l-none"
      />
    </div>
  );
}

/** "2345 6789 0124": groups the 12 digits as they are typed; checks the check digit. */
function AadhaarInput({ defaultValue }: { defaultValue?: string | null }) {
  const group = (digits: string) =>
    digits
      .replace(/\D/g, '')
      .slice(0, 12)
      .replace(/(\d{4})(?=\d)/g, '$1 ');
  return (
    <Input
      id="aadhaar"
      name="aadhaar"
      inputMode="numeric"
      autoComplete="off"
      maxLength={14}
      placeholder="2345 6789 0124"
      defaultValue={group(v(defaultValue))}
      onChange={(e) => {
        const el = e.currentTarget;
        el.value = group(el.value);
        el.setCustomValidity(
          el.value === '' || isValidAadhaar(el.value)
            ? ''
            : 'Not a valid Aadhaar number: check the 12 digits',
        );
      }}
    />
  );
}

// --- The groups ----------------------------------------------------------------------------------

/** Name, date of birth (with the age), gender, blood group. */
export function PersonalFields({
  defaults = {},
  admittedOn,
}: {
  defaults?: StudentDefaults;
  /** YYYY-MM-DD the age is counted at (3 to 30 years); today when adding a student. */
  admittedOn?: string;
}) {
  const day = admittedOn ?? new Date().toISOString().slice(0, 10);
  const born = birthDateRange(day);
  const [dob, setDob] = useState(defaults.dateOfBirth?.slice(0, 10) ?? '');
  const age = dob ? ageOn(dob, day) : null;
  return (
    <Group title="Student" icon={<User />} description="As in official records">
      <Field label="Full name *" htmlFor="fullName" icon={<User />}>
        <Input
          id="fullName"
          name="fullName"
          required
          minLength={2}
          maxLength={100}
          pattern={NAME_PATTERN}
          title={NAME_TITLE}
          autoComplete="off"
          placeholder="e.g. K. Ravi Teja"
          defaultValue={v(defaults.fullName)}
        />
      </Field>
      <Field label="Surname" htmlFor="surname">
        <Input
          id="surname"
          name="surname"
          maxLength={50}
          pattern={NAME_PATTERN}
          title={NAME_TITLE}
          autoComplete="off"
          defaultValue={v(defaults.surname)}
        />
      </Field>
      <Field
        label="Date of birth *"
        htmlFor="dateOfBirth"
        icon={<CalendarDays />}
        hint={age !== null ? `${age} years old at admission` : '3 to 30 years old at admission'}
      >
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          required
          min={born.min}
          max={born.max}
          value={dob}
          onChange={(e) => setDob(e.currentTarget.value)}
        />
      </Field>
      <ChoiceChips
        label="Gender *"
        name="gender"
        options={GENDERS}
        required
        defaultValue={defaults.gender}
      />
      <ChoiceChips
        label="Blood group"
        name="bloodGroup"
        options={BLOOD_GROUPS}
        allowNone
        defaultValue={defaults.bloodGroup}
        className="sm:col-span-2"
      />
    </Group>
  );
}

/** Phones, email, area, current and permanent address ("same as current"). */
export function ContactFields({ defaults = {} }: { defaults?: StudentDefaults }) {
  const [address, setAddress] = useState(v(defaults.address));
  const [same, setSame] = useState(
    !!defaults.address && defaults.address === defaults.permanentAddress,
  );
  const [permanent, setPermanent] = useState(v(defaults.permanentAddress));
  return (
    <Group title="Contact" icon={<Phone />} description="10-digit mobile numbers">
      <Field label="Phone" htmlFor="phone">
        <PhoneInput id="phone" name="phone" defaultValue={defaults.phone} />
      </Field>
      <Field label="Alternate phone" htmlFor="alternatePhone">
        <PhoneInput
          id="alternatePhone"
          name="alternatePhone"
          defaultValue={defaults.alternatePhone}
        />
      </Field>
      <Field label="Email" htmlFor="email" icon={<AtSign />}>
        <Input
          id="email"
          name="email"
          type="email"
          maxLength={100}
          autoComplete="off"
          placeholder="name@example.com"
          defaultValue={v(defaults.email)}
        />
      </Field>
      <Field label="Area" htmlFor="area" icon={<MapPin />} hint="Locality, e.g. Gajuwaka">
        <Input id="area" name="area" minLength={2} maxLength={50} defaultValue={v(defaults.area)} />
      </Field>
      <Field label="Address (now)" htmlFor="address" icon={<Home />} className="sm:col-span-2">
        <Input
          id="address"
          name="address"
          minLength={3}
          maxLength={300}
          value={address}
          onChange={(e) => setAddress(e.currentTarget.value)}
        />
      </Field>
      <Field
        label="Permanent address"
        htmlFor="permanentAddress"
        icon={<Home />}
        className="sm:col-span-2"
      >
        <Input
          id="permanentAddress"
          name="permanentAddress"
          minLength={3}
          maxLength={300}
          readOnly={same}
          value={same ? address : permanent}
          onChange={(e) => setPermanent(e.currentTarget.value)}
        />
      </Field>
      <label className="-mt-2 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
        <input
          type="checkbox"
          checked={same}
          onChange={(e) => setSame(e.currentTarget.checked)}
          className="size-4 accent-[var(--primary)]"
        />
        Same as the current address
      </label>
    </Group>
  );
}

/** Aadhaar, category, sub-caste (sensitive). */
export function IdentityFields({ defaults = {} }: { defaults?: StudentDefaults }) {
  return (
    <Group
      title="Identity and category"
      icon={<Fingerprint />}
      description="Sensitive: only people allowed to see sensitive details see these"
    >
      <Field label="Aadhaar" htmlFor="aadhaar" icon={<IdCard />} hint="12 digits">
        <AadhaarInput defaultValue={defaults.aadhaar} />
      </Field>
      <Field label="Sub-caste" htmlFor="subCaste">
        <Input
          id="subCaste"
          name="subCaste"
          minLength={2}
          maxLength={50}
          defaultValue={v(defaults.subCaste)}
        />
      </Field>
      <ChoiceChips
        label="Category"
        name="category"
        options={CATEGORIES}
        allowNone
        defaultValue={defaults.category}
        className="sm:col-span-2"
      />
    </Group>
  );
}

/** Day scholar / hosteller, bus and pickup point. */
export function StayFields({ defaults = {} }: { defaults?: StudentDefaults }) {
  const [bus, setBus] = useState(defaults.busFacility ?? false);
  return (
    <Group title="Stay and transport" icon={<Bus />}>
      <ChoiceChips
        label="Day scholar / hosteller"
        name="residence"
        options={RESIDENCES}
        allowNone
        defaultValue={defaults.residence}
        className="sm:col-span-2"
      />
      <Switch
        name="busFacility"
        label="Uses the bus"
        description="Then the pickup point is needed"
        checked={bus}
        onChange={setBus}
      />
      {bus ? (
        <Field label="Pickup point *" htmlFor="pickupPoint" icon={<MapPin />}>
          <Input
            id="pickupPoint"
            name="pickupPoint"
            required
            minLength={2}
            maxLength={100}
            placeholder="e.g. Gajuwaka bus stop"
            defaultValue={v(defaults.pickupPoint)}
          />
        </Field>
      ) : (
        <div className="hidden sm:block" />
      )}
    </Group>
  );
}

/** Previous school / college, board, hall ticket, percentage, grade. */
export function EducationFields({ defaults = {} }: { defaults?: StudentDefaults }) {
  return (
    <Group
      title="Previous education"
      icon={<School />}
      description="For lateral entry, or the board exam before joining"
    >
      <Field
        label="School / college"
        htmlFor="previousInstitution"
        icon={<School />}
        className="sm:col-span-2"
      >
        <Input
          id="previousInstitution"
          name="previousInstitution"
          minLength={2}
          maxLength={150}
          defaultValue={v(defaults.previousInstitution)}
        />
      </Field>
      <Field label="Board" htmlFor="previousBoard" icon={<GraduationCap />}>
        <Select id="previousBoard" name="previousBoard" defaultValue={v(defaults.previousBoard)}>
          <option value="">—</option>
          {Object.entries(BOARDS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Hall ticket no" htmlFor="hallTicketNo" icon={<Hash />}>
        <Input
          id="hallTicketNo"
          name="hallTicketNo"
          minLength={4}
          maxLength={20}
          pattern={CODE_PATTERN}
          title={CODE_TITLE}
          defaultValue={v(defaults.hallTicketNo)}
        />
      </Field>
      <Field label="Percentage" htmlFor="previousPercentage" icon={<Percent />} hint="0 to 100">
        <Input
          id="previousPercentage"
          name="previousPercentage"
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step="0.01"
          defaultValue={v(defaults.previousPercentage)}
        />
      </Field>
      <Field label="Grade / points" htmlFor="previousGrade" hint="e.g. 9.2 or A1">
        <Input
          id="previousGrade"
          name="previousGrade"
          maxLength={10}
          pattern="[A-Za-z0-9.+\-]+"
          title="Letters, digits, . + and - only"
          defaultValue={v(defaults.previousGrade)}
        />
      </Field>
    </Group>
  );
}

/** Admission / scholarship test. */
export function TestFields({ defaults = {} }: { defaults?: StudentDefaults }) {
  return (
    <Group
      title="Admission test"
      icon={<Trophy />}
      description="Admission or scholarship test, if taken"
    >
      <Field label="Test no" htmlFor="admissionTestNo" icon={<Hash />}>
        <Input
          id="admissionTestNo"
          name="admissionTestNo"
          maxLength={30}
          pattern={CODE_PATTERN}
          title={CODE_TITLE}
          defaultValue={v(defaults.admissionTestNo)}
        />
      </Field>
      <Field label="Test marks" htmlFor="admissionTestMarks" hint="0 to 1000">
        <Input
          id="admissionTestMarks"
          name="admissionTestMarks"
          type="number"
          inputMode="decimal"
          min={0}
          max={1000}
          step="0.01"
          defaultValue={v(defaults.admissionTestMarks)}
        />
      </Field>
    </Group>
  );
}

/** Medical condition (sensitive) and remarks. */
export function HealthFields({
  defaults = {},
  showSensitive,
}: {
  defaults?: StudentDefaults;
  showSensitive: boolean;
}) {
  return (
    <Group title="Health and notes" icon={<HeartPulse />}>
      {showSensitive && (
        <Field
          label="Medical condition (sensitive)"
          htmlFor="medicalCondition"
          className="sm:col-span-2"
        >
          <Input
            id="medicalCondition"
            name="medicalCondition"
            minLength={2}
            maxLength={500}
            placeholder="e.g. Asthma; allergic to penicillin"
            defaultValue={v(defaults.medicalCondition)}
          />
        </Field>
      )}
      <Field label="Remarks" htmlFor="remarks" className="sm:col-span-2">
        <Input
          id="remarks"
          name="remarks"
          minLength={2}
          maxLength={500}
          defaultValue={v(defaults.remarks)}
        />
      </Field>
    </Group>
  );
}

/** Top ranker (on / off) and learner level. */
export function RankerFields({ defaults = {} }: { defaults?: StudentDefaults }) {
  return (
    <Group title="Top ranker" icon={<Star />} description="Listed on the Top rankers page while on">
      <Switch
        name="topRanker"
        label="Top ranker (active)"
        defaultChecked={defaults.topRanker ?? false}
      />
      <ChoiceChips
        label="Learner level"
        name="learnerLevel"
        options={LEARNER_LEVELS}
        allowNone
        defaultValue={defaults.learnerLevel}
      />
    </Group>
  );
}

/** Every group on one page (Edit student). */
export function StudentFields({
  defaults = {},
  showSensitive,
  admittedOn,
}: {
  defaults?: StudentDefaults;
  showSensitive: boolean;
  admittedOn?: string;
}) {
  return (
    <div className="flex flex-col gap-8">
      {showSensitive && <input type="hidden" name="sensitiveShown" value="1" />}
      <PersonalFields defaults={defaults} admittedOn={admittedOn} />
      <ContactFields defaults={defaults} />
      {showSensitive && <IdentityFields defaults={defaults} />}
      <StayFields defaults={defaults} />
      <EducationFields defaults={defaults} />
      <TestFields defaults={defaults} />
      <HealthFields defaults={defaults} showSensitive={showSensitive} />
      <RankerFields defaults={defaults} />
    </div>
  );
}

/** Whole years from a birth date to a day (both YYYY-MM-DD). */
export function ageOn(born: string, day: string): number {
  const [by, bm, bd] = born.split('-').map(Number);
  const [y, m, d] = day.split('-').map(Number);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}
