/**
 * /students/import: admit many students from a CSV file (Excel: File -> Save as -> CSV), into ONE
 * section chosen on the screen (ADR-0030):
 *   1. choose the branch, the academic year, then the structure level by level (e.g. Junior ›
 *      MPC › JEE Mains), then the section;
 *   2. download the template, fill it in (one student per row; only the students' own columns);
 *   3. "Only check" first: every row is checked and problems are listed by row number;
 *   4. untick "Only check" and import: all rows are saved, or none.
 * Admission numbers: a column only when the organization types them; automatic otherwise.
 * Needs "students.student.import" at the branch.
 */
import {
  ActionForm,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  EmptyState,
  Field,
  PageHeader,
  Select,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { Upload } from 'lucide-react';
import { SectionPicker } from '../../../../components/section-picker';
import { api } from '../../../../lib/api';
import { can, getMe } from '../../../../lib/me';
import { branchesForWork } from '../../../../lib/places';
import { pickerData } from '../../../../lib/structure';
import type { AcademicYear, Branch, OwnOrganization } from '../../../../lib/types';
import { importStudents } from '../actions';

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
  const columns: [string, string][] = [
    [
      manual ? 'admissionNo *' : 'admissionNo',
      manual ? 'Unique in the organization' : 'Leave empty: numbers are automatic',
    ],
    ['admissionDate *', '2026-06-01 or 01/06/2026'],
    ['fullName *', 'As in official records'],
    ['surname', ''],
    ['dateOfBirth *', '2010-05-14 or 14/05/2010'],
    ['gender *', 'male / female / other (or M / F)'],
    ['phone, email, address', ''],
    ['previousInstitution, previousMarks', 'For students joining in a later year'],
    ['rollNo', 'Unique in the section'],
    [
      'guardianName, guardianRelation, guardianPhone',
      'Relation: father / mother / guardian / other',
    ],
  ];

  return (
    <>
      <PageHeader
        back={{ href: '/students', label: 'Back to students' }}
        title="Import students"
        description="Into one section at a time. Check first; then import all rows, or none."
        actions={
          <a
            href="/students/import/template"
            className="text-sm font-medium text-primary hover:underline"
          >
            Download the template
          </a>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Where, and the file</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={importStudents} submitLabel="Go" pendingLabel="Working…">
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
                <input
                  id="file"
                  name="file"
                  type="file"
                  accept=".csv,text/csv"
                  required
                  className="text-sm"
                />
              </Field>
              <Checkbox
                name="dryRun"
                defaultChecked
                label="Only check (save nothing)"
                description="Untick to import once the check shows no problems"
              />
            </ActionForm>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Columns</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHead>
                <tr>
                  <Th>Column</Th>
                  <Th>What to write</Th>
                </tr>
              </TableHead>
              <tbody>
                {columns.map(([column, help]) => (
                  <tr key={column}>
                    <Td className="font-mono text-xs">{column}</Td>
                    <Td className="text-muted-foreground">{help}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <p className="mt-2 text-xs text-muted-foreground">* required</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
