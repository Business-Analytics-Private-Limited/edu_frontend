/**
 * /students/import/template: a CSV file with the import columns and one example row, to open in
 * Excel and fill in (ADR-0031). The columns follow the organization's admission numbering: an
 * admissionNo column only when numbers are typed in (MANUAL), none when they are automatic.
 * Where the students go (branch, section) is chosen on the import screen, not in the file.
 */
import { api } from '../../../../../lib/api';
import { importColumnsFor } from '../../../../../lib/import-columns';
import type { OwnOrganization } from '../../../../../lib/types';

/** A CSV cell: quoted when it holds a comma, quote or line break. */
const cell = (value: string) => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

export async function GET() {
  const organization = await api<OwnOrganization>('/organization');
  const columns = importColumnsFor(organization.admissionNumbering);
  const lines = [
    columns.map((c) => c.name).join(','),
    columns.map((c) => cell(c.example)).join(','),
  ];
  // A byte-order mark at the start tells Excel the file is UTF-8 (accents stay readable).
  const bom = String.fromCharCode(0xfeff);
  return new Response(`${bom}${lines.join('\r\n')}\r\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="students-import-template.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
