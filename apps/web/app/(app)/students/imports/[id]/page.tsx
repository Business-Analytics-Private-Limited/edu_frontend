/**
 * /students/imports/:id: one import record (ADR-0031), e.g. IMP-0007:
 *   - the summary: when, who, where, the file name, rows in the sheet / imported / excluded;
 *   - EXCLUDED rows: the row number in the sheet, the name and admission number written there,
 *     and every reason it was left out; "Download excluded rows" gives them back as a CSV to fix
 *     in Excel and import again;
 *   - IMPORTED students: their row, admission number, and the optional details still missing
 *     (phone, email, address, Aadhaar, parent), to collect later.
 */
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../../../../lib/api';
import type { ImportRunDetail } from '../../../../../lib/types';

export default async function ImportRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await api<ImportRunDetail>(`/students/imports/${id}`);
  const missingCount = run.students.filter((s) => s.missing.length > 0).length;

  return (
    <>
      <PageHeader
        back={{ href: '/students/imports', label: 'Back to import history' }}
        title={`Import ${run.code}`}
        description={`${run.branchName} › ${run.section} · ${run.academicYearName} · by ${run.importedByName ?? '—'} on ${new Date(run.createdAt).toLocaleString()}${run.fileName ? ` · ${run.fileName}` : ''}`}
      />

      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-4">
        {[
          ['Rows in the sheet', run.totalRows, 'text-foreground'],
          ['Imported', run.importedCount, 'text-success'],
          [
            'Excluded',
            run.excludedCount,
            run.excludedCount ? 'text-warning' : 'text-muted-foreground',
          ],
        ].map(([label, value, color]) => (
          <Card key={label as string}>
            <CardContent className="flex flex-col gap-1 p-3 pt-3 sm:p-5 sm:pt-5">
              <span className="text-xs text-muted-foreground sm:text-sm">{label}</span>
              <span className={`text-2xl font-semibold tabular-nums sm:text-3xl ${color}`}>
                {value}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {run.excludedRows.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Excluded rows: not imported</CardTitle>
              <a
                href={`/students/imports/${run.id}/excluded`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Download excluded rows (CSV)
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <Table className="min-w-0">
              <TableHead>
                <tr>
                  <Th className="w-16">Row</Th>
                  <Th>Student (as in the sheet)</Th>
                  <Th>Why it was left out</Th>
                </tr>
              </TableHead>
              <tbody>
                {run.excludedRows.map((e) => (
                  <tr key={e.row}>
                    <Td className="font-mono">{e.row}</Td>
                    <Td>
                      {e.fullName ?? <span className="text-muted-foreground">(no name)</span>}
                      {e.admissionNo && (
                        <span className="block font-mono text-xs text-muted-foreground">
                          {e.admissionNo}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <ul className="list-disc pl-4 text-sm">
                        {e.reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <p className="mt-2 text-xs text-muted-foreground">
              Fix these rows in the downloaded file and import it again into the same section.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Imported students
            {missingCount > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({missingCount} with details still missing)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <tr>
                <Th className="w-16">Row</Th>
                <Th>Adm. no</Th>
                <Th>Name</Th>
                <Th>Still missing</Th>
              </tr>
            </TableHead>
            <tbody>
              {run.students.map((s) => (
                <tr key={s.id}>
                  <Td className="font-mono">{s.importRow ?? '—'}</Td>
                  <Td className="font-mono text-xs">{s.admissionNo}</Td>
                  <Td>
                    <Link
                      href={`/students/${s.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {s.fullName}
                    </Link>
                  </Td>
                  <Td>
                    {s.missing.length ? (
                      <span className="text-sm text-muted-foreground">{s.missing.join(', ')}</span>
                    ) : (
                      <Badge variant="success">Complete</Badge>
                    )}
                  </Td>
                </tr>
              ))}
              {run.students.length === 0 && (
                <tr>
                  <Td colSpan={4} className="py-6 text-center text-muted-foreground">
                    The students of this import were deleted since.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
