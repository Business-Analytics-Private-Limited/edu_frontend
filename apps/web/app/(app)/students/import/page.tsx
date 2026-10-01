/**
 * /students/import: admit many students from a CSV file (Excel: File -> Save as -> CSV).
 *   1. download the template, fill it in (one student per row);
 *   2. choose the campus (and the academic year, if rows have a section), choose the file;
 *   3. "Only check" first: every row is checked and problems are listed by row number;
 *   4. untick "Only check" and import: all rows are saved, or none.
 * Needs "students.student.import" at the campus.
 */
import {
  ActionForm,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  PageHeader,
  Select,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import { can, canAt, getMe } from '../../../../lib/me';
import type { AcademicYear, Institution } from '../../../../lib/types';
import { importStudents } from '../actions';

const COLUMNS: [string, string][] = [
  ['admissionNo', 'Leave empty for automatic numbering (if set up)'],
  ['admissionDate *', '2026-06-01 or 01/06/2026'],
  ['fullName *', 'As in official records'],
  ['surname', ''],
  ['dateOfBirth *', '2010-05-14 or 14/05/2010'],
  ['gender *', 'male / female / other (or M / F)'],
  ['phone, email, address', ''],
  ['batch', "The batch's code, e.g. B2026"],
  ['section', 'Class codes from the top, e.g. Y1/MPC/A'],
  ['rollNo', 'Unique in the section'],
  ['guardianName, guardianRelation, guardianPhone', 'Relation: father / mother / guardian / other'],
];

export default async function ImportStudentsPage() {
  const me = await getMe();
  const [institutions, years] = await Promise.all([
    can(me, 'platform.institution.view') ? api<Institution[]>('/institutions') : [],
    can(me, 'academic.year.view') ? api<AcademicYear[]>('/academic-years') : [],
  ]);
  const campuses = institutions.flatMap((i) =>
    i.campuses
      .filter((c) => canAt(me, 'students.student.import', { institutionId: i.id, campusId: c.id }))
      .map((c) => ({ ...c, institution: i })),
  );

  return (
    <>
      <PageHeader
        title="Import students"
        description="Admit many students from a CSV file. Check first; then import all rows, or none."
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
            <CardTitle>File</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={importStudents} submitLabel="Go" pendingLabel="Working…">
              <Field label="Campus" htmlFor="campusId">
                <Select id="campusId" name="campusId" required>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.institution.name})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Academic year"
                htmlFor="academicYearId"
                hint="Needed when rows have a section"
              >
                <Select id="academicYearId" name="academicYearId">
                  <option value="">—</option>
                  {years
                    .filter((y) => y.status !== 'CLOSED')
                    .map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name} ({y.institution.name})
                      </option>
                    ))}
                </Select>
              </Field>
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
                {COLUMNS.map(([column, help]) => (
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
