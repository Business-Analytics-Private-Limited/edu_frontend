/**
 * /students/imports/:id/excluded: the rows an import left out, as a CSV with the same columns
 * as the template, to fix in Excel and import again (ADR-0031). The values are those written in
 * the sheet; a last column says why each row was left out (it is ignored when importing).
 * Sensitive values only come back for users with "students.sensitive.view".
 */
import { api } from '../../../../../../lib/api';
import { importColumnsFor } from '../../../../../../lib/import-columns';
import type { ImportRunDetail, OwnOrganization } from '../../../../../../lib/types';

const cell = (value: string) => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [run, organization] = await Promise.all([
    api<ImportRunDetail>(`/students/imports/${id}`),
    api<OwnOrganization>('/organization'),
  ]);
  const columns = importColumnsFor(organization.admissionNumbering).map((c) => c.name);
  const lines = [
    [...columns, 'whyExcluded'].join(','),
    ...run.excludedRows.map((e) =>
      [...columns.map((c) => e.values[c] ?? ''), e.reasons.join('; ')].map(cell).join(','),
    ),
  ];
  const bom = String.fromCharCode(0xfeff); // Excel: UTF-8
  return new Response(`${bom}${lines.join('\r\n')}\r\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${run.code}-excluded-rows.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
