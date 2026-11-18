'use client';
/**
 * "Add student" as a step-by-step wizard (ADR-0031):
 *
 *   Placement → Student → Contact → Family → Background → More → Review
 *
 * Every step lives inside ONE form (the page's ActionForm with ownButtons), so all values are
 * sent together at the end; the steps only hide and show parts of it.
 *   - "Next" checks the current step's fields first (problems appear under the fields);
 *   - Enter in a field means "Next" (not "send") until the last step;
 *   - if the browser still finds a problem when sending, the wizard jumps to that step;
 *   - a live student card (avatar, age, branch and section, how complete the record is) and
 *     a Review step with every value and "Edit" links back to its step.
 * Desktop: steps on the left, the student card on the right. Phone: a scrolling chip bar of
 * steps on top, a compact card, and a sticky Back / Next bar at the bottom.
 */
import { Button, Field, Input, Select, cn, useActionFormPending } from '@eduplatform/ui';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  GraduationCap,
  Hash,
  Loader2,
  Phone,
  School,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { SectionPicker, type SectionPickerProps } from '../../../../components/section-picker';
import {
  ageOn,
  ContactFields,
  EducationFields,
  HealthFields,
  IdentityFields,
  PersonalFields,
  RankerFields,
  StayFields,
  TestFields,
} from '../../../../components/student-fields';
import {
  ADMISSION_NO_PATTERN,
  ADMISSION_NO_TITLE,
  NAME_PATTERN,
  NAME_TITLE,
  PHONE_PATTERN,
  PHONE_TITLE,
} from '../../../../lib/student-rules';
import { BOARDS, CATEGORIES, GENDERS, LEARNER_LEVELS, RESIDENCES } from '../labels';

interface Props {
  branches: { id: string; name: string }[];
  /** The section picker's data; null when the Academic module isn't available. */
  picker: Omit<SectionPickerProps, 'branches' | 'name'> | null;
  /** Open academic years; `current` = the active one, `today` = its dates include today. */
  years: { id: string; name: string; current: boolean; today: boolean }[];
  /** Admission numbers are typed in (MANUAL). */
  manual: boolean;
  /** The automatic pattern, e.g. {CODE}{YY}{SEQ:4}. */
  pattern: string | null;
}

const STEPS = [
  { title: 'Placement', hint: 'Branch, section, admission', icon: <School /> },
  { title: 'Student', hint: 'Name, birth, gender', icon: <User /> },
  { title: 'Contact', hint: 'Phones and address', icon: <Phone /> },
  { title: 'Family', hint: 'Father, mother, guardian', icon: <Users /> },
  { title: 'Background', hint: 'Education and test', icon: <GraduationCap /> },
  { title: 'More', hint: 'Identity, stay, health, ranking', icon: <Sparkles /> },
  { title: 'Review', hint: 'Check and add', icon: <ClipboardCheck /> },
] as const;
const LAST = STEPS.length - 1;

/** Optional details counted for "how complete" (required ones are always there). */
const OPTIONAL = [
  'surname',
  'bloodGroup',
  'phone',
  'alternatePhone',
  'email',
  'area',
  'address',
  'permanentAddress',
  'aadhaar',
  'category',
  'residence',
  'previousInstitution',
  'previousBoard',
  'previousPercentage',
  'fatherName',
  'motherName',
  'classId',
  'rollNo',
];

const PARENTS = [
  { key: 'father', label: 'Father' },
  { key: 'mother', label: 'Mother' },
  { key: 'guardian', label: 'Guardian' },
] as const;

type Values = Record<string, string>;

export function AdmissionWizard({ branches, picker, years, manual, pattern }: Props) {
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [values, setValues] = useState<Values>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const pending = useActionFormPending();
  const today = new Date().toISOString().slice(0, 10);

  const form = () => rootRef.current?.closest('form') ?? null;
  /** Reads the whole form (all steps) for the card and the review, right now. */
  const read = () => {
    const f = form();
    if (!f) return;
    const next: Values = {};
    for (const [key, value] of new FormData(f)) if (typeof value === 'string') next[key] = value;
    setValues(next);
  };
  /**
   * The same, a moment later (after the browser's "input" AND "change" events). Choosing in a
   * list fires "input" then "change": re-drawing between the two would put a controlled list
   * (the section picker's) back to its old value before its onChange sees the choice.
   */
  const refresh = () => {
    window.setTimeout(read, 0);
  };

  /** Checks one step's fields; shows the problems and focuses the first. */
  const stepIsValid = (index: number) => {
    const section = rootRef.current?.querySelector(`[data-step="${index}"]`);
    if (!section) return true;
    const fields = Array.from(
      section.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select, textarea'),
    );
    const invalid = fields.filter((f) => !f.checkValidity()); // fires "invalid": shown under it
    if (invalid.length === 0) return true;
    setStep(index);
    setTimeout(() => invalid[0].focus(), 50);
    return false;
  };

  const goTo = (index: number) => {
    // Forward only through valid steps.
    for (let i = step; i < index; i++) if (!stepIsValid(i)) return;
    read();
    setStep(index);
    setReached((r) => Math.max(r, index));
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (e.key === 'Enter' && step < LAST && target.tagName === 'INPUT') {
      e.preventDefault();
      goTo(step + 1);
    }
  };

  // Live card values
  const name = [values.fullName, values.surname].filter(Boolean).join(' ').trim();
  const branchId = values.branchId ?? branches[0]?.id;
  const branch = branches.find((b) => b.id === branchId)?.name;
  const section = picker?.sections.find((s) => s.id === values.classId);
  const sectionLabel = section
    ? `${'path' in section ? `${section.path} › ` : ''}${section.name}`
    : null;
  // The year to start with: the current one; else the open year that includes today; else the
  // only one. A section chosen without a year would otherwise be lost.
  const defaultYear =
    years.find((y) => y.current)?.id ??
    years.find((y) => y.today)?.id ??
    (years.length === 1 ? years[0].id : '');
  const branchHasNoSections = !!picker && !picker.sections.some((s) => s.branchId === branchId);
  const age = values.dateOfBirth ? ageOn(values.dateOfBirth, values.admissionDate || today) : null;
  const filled = OPTIONAL.filter((k) => values[k]?.trim()).length;
  const complete = Math.round((filled / OPTIONAL.length) * 100);
  const required = [
    ...(manual ? [['Admission no', values.admissionNo] as const] : []),
    ['Admission date', values.admissionDate] as const,
    ['Branch', branchId] as const,
    ['Full name', values.fullName] as const,
    ['Date of birth', values.dateOfBirth] as const,
    ['Gender', values.gender] as const,
  ];
  const mainContact = PARENTS.find((p) => values[`${p.key}Name`]?.trim());

  const card = (
    <StudentCard
      name={name}
      admissionNo={manual ? values.admissionNo : pattern ? `Automatic (${pattern})` : 'Automatic'}
      branch={branch}
      section={sectionLabel}
      age={age}
      gender={values.gender ? GENDERS[values.gender as keyof typeof GENDERS] : null}
      phone={values.phone}
      flags={[
        values.residence && RESIDENCES[values.residence as keyof typeof RESIDENCES],
        values.busFacility === 'on' && 'Bus',
        values.topRanker === 'on' && 'Top ranker',
      ]}
      complete={complete}
      required={required.map(([label, value]) => [label, !!value?.trim()])}
    />
  );

  return (
    <div
      ref={rootRef}
      onInputCapture={refresh}
      onChangeCapture={refresh}
      onKeyDown={onKeyDown}
      onInvalidCapture={(e) => {
        // The browser found a problem on sending: show the step it is in.
        const s = (e.target as HTMLElement).closest<HTMLElement>('[data-step]')?.dataset.step;
        if (s !== undefined && Number(s) !== step) {
          setStep(Number(s));
          const target = e.target as HTMLElement;
          setTimeout(() => target.focus(), 50);
        }
      }}
      className="scroll-mt-20"
    >
      <input type="hidden" name="sensitiveShown" value="1" />

      {/* Banner with the progress */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-linear-to-br from-primary to-highlight p-5 text-primary-foreground shadow-lg shadow-primary/20 sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 size-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/70">
              New admission
            </p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{name || 'Add a student'}</h2>
            <p className="mt-1 text-sm text-white/80">
              Step {step + 1} of {STEPS.length}: {STEPS[step].title}. Fields marked * are required.
            </p>
          </div>
          <div className="w-full sm:w-56">
            <div className="mb-1 flex justify-between text-xs text-white/80">
              <span>Progress</span>
              <span>{Math.round((step / LAST) * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-500"
                style={{ width: `${(step / LAST) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Phone / tablet: steps as a scrolling chip bar */}
      <nav
        aria-label="Steps"
        className="sticky top-14 z-20 -mx-4 mb-4 flex gap-2 overflow-x-auto border-b bg-background/90 px-4 py-2 backdrop-blur lg:hidden"
      >
        {STEPS.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => goTo(i)}
            aria-current={i === step ? 'step' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors [&_svg]:size-3.5',
              i === step
                ? 'border-primary bg-primary text-primary-foreground'
                : i <= reached
                  ? 'border-primary/30 bg-accent text-accent-foreground'
                  : 'bg-card text-muted-foreground',
            )}
          >
            {i < step ? <Check /> : s.icon}
            {s.title}
          </button>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_280px]">
        {/* Desktop: steps on the left */}
        <nav aria-label="Steps" className="hidden lg:block">
          <ol className="sticky top-20 flex flex-col gap-1">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={i === step ? 'step' : undefined}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                    i === step ? 'bg-card shadow-sm ring-1 ring-border' : 'hover:bg-card/60',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full border text-xs transition-colors [&_svg]:size-4',
                      i === step
                        ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30'
                        : i < step || i <= reached
                          ? 'border-primary/40 bg-accent text-accent-foreground'
                          : 'bg-card text-muted-foreground',
                    )}
                  >
                    {i < step ? <Check /> : s.icon}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        'block text-sm font-medium',
                        i === step ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {s.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{s.hint}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex min-w-0 flex-col gap-4">
          {/* Below the wide layout: a compact summary instead of the full card */}
          <div className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm xl:hidden">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-highlight text-sm font-semibold text-white">
              {initialsOf(name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{name || 'New student'}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[branch, sectionLabel ?? 'Not placed yet', age !== null ? `${age} yrs` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold tabular-nums text-primary">{complete}%</p>
              <p className="text-[11px] text-muted-foreground">
                {required.filter(([, value]) => value?.trim()).length}/{required.length} required
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
            {/* 1. Placement */}
            <section data-step={0} hidden={step !== 0} className="ep-step-in flex flex-col gap-8">
              <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-3 text-sm font-semibold">Admission</legend>
                {manual ? (
                  <Field label="Admission no *" htmlFor="admissionNo" icon={<Hash />}>
                    <Input
                      id="admissionNo"
                      name="admissionNo"
                      required
                      maxLength={30}
                      pattern={ADMISSION_NO_PATTERN}
                      title={ADMISSION_NO_TITLE}
                      placeholder="e.g. ASC260001"
                      autoComplete="off"
                    />
                  </Field>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Admission no</span>
                    <span className="flex h-10 items-center gap-2 rounded-md border border-dashed bg-muted/40 px-3 text-sm text-muted-foreground sm:h-9">
                      <Sparkles className="size-4 text-highlight" />
                      Automatic{pattern ? ` (${pattern})` : ''}
                    </span>
                  </div>
                )}
                <Field label="Admission date *" htmlFor="admissionDate">
                  <Input
                    id="admissionDate"
                    name="admissionDate"
                    type="date"
                    required
                    defaultValue={today}
                  />
                </Field>
              </fieldset>
              <fieldset className="flex flex-col gap-4">
                <legend className="mb-3 text-sm font-semibold">
                  Branch and section
                  <span className="ml-2 font-normal text-muted-foreground">
                    The section can also be chosen later
                  </span>
                </legend>
                {!years.some((y) => y.current) && years.length > 0 && (
                  <Notice>
                    No academic year is current yet ({years.map((y) => y.name).join(', ')}{' '}
                    {years.length === 1 ? 'is' : 'are'} planned).{' '}
                    <Link href="/academic/years" className="font-medium underline">
                      Make one current
                    </Link>{' '}
                    in Academic years; until then choose the year below.
                  </Notice>
                )}
                {picker ? (
                  <>
                    <SectionPicker
                      {...picker}
                      branches={branches}
                      name="classId"
                      emptyLabel="Not placed yet"
                    />
                    {branchHasNoSections && (
                      <Notice>
                        {branch} has no sections yet, so the student can only be added without one.{' '}
                        <Link href="/academic/sections" className="font-medium underline">
                          Add sections
                        </Link>{' '}
                        first to place them now.
                      </Notice>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label={values.classId ? 'Academic year *' : 'Academic year'}
                        htmlFor="academicYearId"
                        hint="Needed when a section is chosen"
                      >
                        <Select
                          id="academicYearId"
                          name="academicYearId"
                          required={!!values.classId}
                          defaultValue={defaultYear}
                        >
                          <option value="">—</option>
                          {years.map((y) => (
                            <option key={y.id} value={y.id}>
                              {y.name}
                              {y.current ? ' · current' : ''}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Roll no" htmlFor="rollNo" icon={<Hash />}>
                        <Input id="rollNo" name="rollNo" maxLength={20} />
                      </Field>
                    </div>
                  </>
                ) : (
                  <Field label="Branch *" htmlFor="branchId">
                    <Select id="branchId" name="branchId" required>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
              </fieldset>
            </section>

            {/* 2. Student */}
            <section data-step={1} hidden={step !== 1} className="ep-step-in">
              <PersonalFields admittedOn={values.admissionDate || today} />
            </section>

            {/* 3. Contact */}
            <section data-step={2} hidden={step !== 2} className="ep-step-in">
              <ContactFields />
            </section>

            {/* 4. Family */}
            <section data-step={3} hidden={step !== 3} className="ep-step-in flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-semibold">Parents / guardians</h3>
                <p className="text-xs text-muted-foreground">
                  All optional. The first one filled in is the main contact
                  {mainContact ? `: ${mainContact.label.toLowerCase()}` : ''}. A phone or occupation
                  needs the name.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {PARENTS.map((p) => {
                  const isMain = mainContact?.key === p.key;
                  return (
                    <div
                      key={p.key}
                      className={cn(
                        'flex min-w-0 flex-col gap-3 rounded-xl border p-4 transition-colors',
                        isMain ? 'border-primary/50 bg-accent/40' : 'bg-card',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <span className="flex size-7 items-center justify-center rounded-full bg-muted [&_svg]:size-3.5">
                            <User />
                          </span>
                          {p.label}
                        </span>
                        {isMain && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                            Main contact
                          </span>
                        )}
                      </div>
                      <Field label="Name" htmlFor={`${p.key}Name`}>
                        <Input
                          id={`${p.key}Name`}
                          name={`${p.key}Name`}
                          minLength={2}
                          maxLength={100}
                          pattern={NAME_PATTERN}
                          title={NAME_TITLE}
                          autoComplete="off"
                        />
                      </Field>
                      <Field label="Phone" htmlFor={`${p.key}Phone`} icon={<Phone />}>
                        <Input
                          id={`${p.key}Phone`}
                          name={`${p.key}Phone`}
                          type="tel"
                          inputMode="tel"
                          pattern={PHONE_PATTERN}
                          title={PHONE_TITLE}
                        />
                      </Field>
                      <Field label="Occupation" htmlFor={`${p.key}Occupation`}>
                        <Input
                          id={`${p.key}Occupation`}
                          name={`${p.key}Occupation`}
                          minLength={2}
                          maxLength={50}
                        />
                      </Field>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 5. Background */}
            <section data-step={4} hidden={step !== 4} className="ep-step-in flex flex-col gap-8">
              <EducationFields />
              <TestFields />
            </section>

            {/* 6. More */}
            <section data-step={5} hidden={step !== 5} className="ep-step-in flex flex-col gap-8">
              <IdentityFields />
              <StayFields />
              <HealthFields showSensitive />
              <RankerFields />
            </section>

            {/* 7. Review */}
            <section data-step={6} hidden={step !== 6} className="ep-step-in flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-semibold">Check everything, then add the student</h3>
                <p className="text-xs text-muted-foreground">
                  Empty details can be filled in later with Edit.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {review(values, { branch, section: sectionLabel, years, manual, pattern }).map(
                  ([title, stepIndex, rows]) => (
                    <div key={title} className="min-w-0 rounded-xl border bg-muted/20 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold">{title}</span>
                        <button
                          type="button"
                          onClick={() => setStep(stepIndex)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <dl className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 gap-y-1 text-sm">
                        {rows.map(([label, value]) => (
                          <ReviewRow key={label} label={label} value={value} />
                        ))}
                      </dl>
                    </div>
                  ),
                )}
              </div>
            </section>
          </div>

          {/* Back / Next, always in reach (sticks to the bottom of the screen) */}
          <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-3 border-t bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || pending}
            >
              <ArrowLeft /> <span className="hidden sm:inline">Back</span>
            </Button>
            <span className="text-xs text-muted-foreground">
              {step + 1} / {STEPS.length}
            </span>
            {step < LAST ? (
              <Button type="button" onClick={() => goTo(step + 1)} className="min-w-28">
                Next <ArrowRight />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={pending}
                className="min-w-36 bg-linear-to-r from-primary to-highlight shadow-lg shadow-primary/25"
              >
                {pending ? <Loader2 className="animate-spin" /> : <Check />}
                {pending ? 'Adding…' : 'Add student'}
              </Button>
            )}
          </div>
        </div>

        {/* Wide screens: the student card on the right */}
        <aside className="hidden xl:block">
          <div className="sticky top-20">{card}</div>
        </aside>
      </div>
    </div>
  );
}

// --- The live student card -----------------------------------------------------------------------

function StudentCard({
  name,
  admissionNo,
  branch,
  section,
  age,
  gender,
  phone,
  flags,
  complete,
  required,
}: {
  name: string;
  admissionNo?: string;
  branch?: string;
  section: string | null;
  age: number | null;
  gender: string | null;
  phone?: string;
  flags: (string | false | undefined)[];
  complete: number;
  required: [string, boolean][];
}) {
  const initials = initialsOf(name);
  const circumference = 2 * Math.PI * 22;
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="h-14 bg-linear-to-r from-primary/80 to-highlight/80" />
      <div className="-mt-8 flex flex-col gap-4 p-4">
        <div className="flex items-end justify-between gap-3">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-highlight text-xl font-semibold text-white shadow-lg ring-4 ring-card">
            {initials}
          </span>
          <span
            className="relative flex size-14 items-center justify-center"
            title="Optional details filled in"
          >
            <svg viewBox="0 0 52 52" className="absolute inset-0 -rotate-90">
              <circle cx="26" cy="26" r="22" fill="none" strokeWidth="4" className="stroke-muted" />
              <circle
                cx="26"
                cy="26"
                r="22"
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                className="stroke-primary transition-[stroke-dashoffset] duration-500"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - complete / 100)}
              />
            </svg>
            <span className="text-xs font-semibold">{complete}%</span>
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{name || 'New student'}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {admissionNo || 'Admission no'}
          </p>
        </div>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Branch</dt>
          <dd className="truncate">{branch ?? '—'}</dd>
          <dt className="text-muted-foreground">Section</dt>
          <dd className="break-words">{section ?? 'Not placed yet'}</dd>
          <dt className="text-muted-foreground">Age</dt>
          <dd>{age !== null ? `${age} years` : '—'}</dd>
          <dt className="text-muted-foreground">Gender</dt>
          <dd>{gender ?? '—'}</dd>
          <dt className="text-muted-foreground">Phone</dt>
          <dd className="truncate">{phone || '—'}</dd>
        </dl>
        {flags.some(Boolean) && (
          <div className="flex flex-wrap gap-1.5">
            {flags.filter(Boolean).map((f) => (
              <span
                key={f as string}
                className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
              >
                {f}
              </span>
            ))}
          </div>
        )}
        <div className="border-t pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Required
          </p>
          <ul className="grid grid-cols-2 gap-1.5 text-xs xl:grid-cols-1">
            {required.map(([label, done]) => (
              <li
                key={label}
                className={cn(
                  'flex items-center gap-1.5',
                  done ? 'text-success' : 'text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex size-4 items-center justify-center rounded-full border [&_svg]:size-3',
                    done ? 'border-success bg-success text-white' : '',
                  )}
                >
                  {done && <Check />}
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// --- The review ----------------------------------------------------------------------------------

function ReviewRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words">
        {value || <span className="text-muted-foreground/60">—</span>}
      </dd>
    </>
  );
}

/** [title, step to edit it, [label, value][]] for the Review step. */
function review(
  v: Values,
  ctx: {
    branch?: string;
    section: string | null;
    years: { id: string; name: string }[];
    manual: boolean;
    pattern: string | null;
  },
): [string, number, [string, string | undefined][]][] {
  const pick = <T extends Record<string, string>>(list: T, key?: string) =>
    key ? (list as Record<string, string>)[key] : undefined;
  const yes = (on?: string) => (on === 'on' ? 'Yes' : 'No');
  const parent = (key: string) =>
    v[`${key}Name`]
      ? [v[`${key}Name`], v[`${key}Phone`], v[`${key}Occupation`]].filter(Boolean).join(' · ')
      : undefined;
  return [
    [
      'Placement',
      0,
      [
        [
          'Admission no',
          ctx.manual ? v.admissionNo : `Automatic${ctx.pattern ? ` (${ctx.pattern})` : ''}`,
        ],
        ['Admission date', v.admissionDate],
        ['Branch', ctx.branch],
        ['Section', ctx.section ?? 'Not placed yet'],
        ['Academic year', ctx.years.find((y) => y.id === v.academicYearId)?.name],
        ['Roll no', v.rollNo],
      ],
    ],
    [
      'Student',
      1,
      [
        ['Full name', [v.fullName, v.surname].filter(Boolean).join(' ')],
        ['Date of birth', v.dateOfBirth],
        ['Gender', pick(GENDERS, v.gender)],
        ['Blood group', v.bloodGroup],
      ],
    ],
    [
      'Contact',
      2,
      [
        ['Phone', v.phone],
        ['Alternate phone', v.alternatePhone],
        ['Email', v.email],
        ['Area', v.area],
        ['Address', v.address],
        ['Permanent address', v.permanentAddress],
      ],
    ],
    [
      'Family',
      3,
      [
        ['Father', parent('father')],
        ['Mother', parent('mother')],
        ['Guardian', parent('guardian')],
      ],
    ],
    [
      'Background',
      4,
      [
        ['School / college', v.previousInstitution],
        ['Board', pick(BOARDS, v.previousBoard)],
        ['Hall ticket no', v.hallTicketNo],
        ['Percentage', v.previousPercentage && `${v.previousPercentage}%`],
        ['Grade / points', v.previousGrade],
        ['Test no / marks', [v.admissionTestNo, v.admissionTestMarks].filter(Boolean).join(' · ')],
      ],
    ],
    [
      'More',
      5,
      [
        ['Aadhaar', v.aadhaar],
        ['Category', [pick(CATEGORIES, v.category), v.subCaste].filter(Boolean).join(' · ')],
        ['Day scholar / hosteller', pick(RESIDENCES, v.residence)],
        ['Bus', v.busFacility === 'on' ? `Yes · ${v.pickupPoint ?? ''}` : 'No'],
        ['Medical condition', v.medicalCondition],
        ['Remarks', v.remarks],
        [
          'Top ranker',
          [yes(v.topRanker), pick(LEARNER_LEVELS, v.learnerLevel)].filter(Boolean).join(' · '),
        ],
      ],
    ],
  ];
}

/** "K. Sai Charan" -> "KS" (letters only); "?" when there is no name yet. */
function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter((w) => /[A-Za-z]/.test(w[0] ?? ''))
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || '?'
  );
}

/** A gentle note in a step (e.g. "No academic year is current yet"). */
function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">
      {children}
    </p>
  );
}
