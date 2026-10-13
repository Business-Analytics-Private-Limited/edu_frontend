/**
 * /students/import: admit many students from a CSV file (Excel: File -> Save as -> CSV), into ONE
 * section chosen on the screen (ADR-0030, ADR-0031):
 *   1. choose the branch, the academic year, then the structure level by level (e.g. Junior ›
 *      MPC › JEE Mains), then the section;
 *   2. download the template, fill it in (one student per row; only the students' own columns,
 *      lib/import-columns.ts);
 *   3. "Check the file": every row is checked with the "Add student" rules, nothing is saved;
 *   4. "Import students": the valid rows are saved, the invalid ones excluded with their reasons;
 *      the import record (IMP-0001 …) opens.
 * Automatic admission numbers can be switched on or off here too (the template then has no / an
 * admissionNo column). Needs "students.student.import" at the branch.
 */
import {
  ActionForm,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  FileInput,
  PageHeader,
  Select,
} from '@eduplatform/ui';
import { Upload } from 'lucide-react';
import Link from 'next/link';
import { SectionPicker } from '../../../../components/section-picker';
import { api } from '../../../../lib/api';
import { ImportColumnGuide } from '../../../../components/import-column-guide';
import { groupedColumns, importColumnsFor } from '../../../../lib/import-columns';
import { can, canAt, getMe } from '../../../../lib/me';
import { branchesForWork } from '../../../../lib/places';
import { pickerData } from '../../../../lib/structure';
import type { AcademicYear, Branch, OwnOrganization } from '../../../../lib/types';
import { importStudents } from '../actions';
import { NumberingForm } from '../numbering-form';

export default async function ImportStudentsPage() {
  const me = await getMe();
  const [allBranches, years, organization] = await Promise.all([
    can(me, 'platform.branch.view') ? api<Branch[]>('/branches') : [],
    can(me, 'academic.year.view') ? api<AcademicYear[]>('/academic-years') : [],
    api<OwnOrganization>('/organization'),
  ]);
  const branches = branchesForWork(me, allBranches, 'students.student.import');
  if (branches.length === 0 || !can(me, 'academic.structure.view')) {
    return (
      <>
        <PageHeader
          back={{ href: '/students', label: 'Back to students' }}
          title="Import students"
        />
        <EmptyState
          icon={<Upload />}
          title="Nowhere to import to"
          description="Your roles do not allow importing students at any branch."
        />
      </>
    );
  }
  const picker = await pickerData(branches.map((b) => b.id));
  const openYears = years.filter((y) => y.status !== 'CLOSED');
  const manual = organization.admissionNumbering === 'MANUAL';
  const columns = importColumnsFor(organization.admissionNumbering);
  const canSetNumbering = canAt(me, 'students.settings.update', {});

  return (
    <>
      <PageHeader
        back={{ href: '/students', label: 'Back to students' }}
        title="Import students"
        description="Into one section at a time. Valid rows are imported; rows with problems are left out and listed with the reason."
        actions={
          <div className="flex flex-wrap gap-4 text-sm font-medium">
            <a href="/students/import/template" className="text-primary hover:underline">
              Download the template
            </a>
            <Link href="/students/imports" className="text-primary hover:underline">
              Import history
            </Link>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Where, and the file</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm
              action={importStudents}
              submitLabel="Check the file"
              submitName="intent"
              submitValue="check"
              submitVariant="outline"
              secondary={{ label: 'Import students', name: 'intent', value: 'import' }}
              pendingLabel="Working…"
            >
              <SectionPicker
                {...picker}
                branches={branches}
                name="classId"
                required
                afterBranch={
                  <Field label="Academic year" htmlFor="academicYearId">
                    <Select
                      id="academicYearId"
                      name="academicYearId"
                      required
                      defaultValue={openYears.find((y) => y.status === 'ACTIVE')?.id}
                    >
                      {openYears.map((y) => (
                        <option key={y.id} value={y.id}>
                          {y.name}
                          {y.status === 'ACTIVE' ? ' · current' : ''}
                        </option>
                      ))}
                    </Select>
                  </Field>
                }
              />
              <Field label="CSV file" htmlFor="file" hint="Up to 2000 students per file">
                <FileInput id="file" name="file" accept=".csv,text/csv" required />
              </Field>
              <p className="text-xs text-muted-foreground">
                <strong>Check the file</strong> saves nothing: it says how many rows can be imported
                and which will be excluded, and why. <strong>Import students</strong> saves the
                valid rows; rows with a problem (or already on record) are left out.
              </p>
            </ActionForm>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Admission numbers</CardTitle>
              <CardDescription>
                {manual
                  ? 'Automatic numbers are OFF: the sheet needs an admissionNo column.'
                  : `Automatic numbers are ON (${organization.admissionNoPattern}): the sheet has no admissionNo column.`}{' '}
                Download the template again after changing this.
              </CardDescription>
            </CardHeader>
            {canSetNumbering && (
              <CardContent>
                <NumberingForm organization={organization} />
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Columns</CardTitle>
              <CardDescription>
                One student per row. Where they go is chosen on the left, not in the sheet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportColumnGuide groups={groupedColumns(columns)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
