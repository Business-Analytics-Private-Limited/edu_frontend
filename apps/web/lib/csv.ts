/**
 * Reads a CSV file (as saved by Excel or Google Sheets) into rows of { column: value }.
 *   - the first line is the header; column names are matched without spaces / case,
 *     so "Admission No", "admission_no" and "admissionNo" are the same column;
 *   - values may be in "quotes" (with "" for a quote inside), and may contain commas;
 *   - comma, semicolon or tab separated (Excel uses ; in some countries);
 *   - empty lines are skipped.
 */
export function parseCsv(text: string, columns: string[]): Record<string, string>[] {
  const clean = text.replace(/^\uFEFF/, ''); // Excel's byte-order mark
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = [',', ';', '\t'].sort(
    (a, b) => firstLine.split(b).length - firstLine.split(a).length,
  )[0];

  const lines = splitRecords(clean, delimiter).filter((cells) =>
    cells.some((c) => c.trim() !== ''),
  );
  if (lines.length === 0) return [];
  const key = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const wanted = new Map(columns.map((c) => [key(c), c]));
  const header = lines[0].map((h) => wanted.get(key(h)));

  return lines.slice(1).map((cells) => {
    const row: Record<string, string> = {};
    header.forEach((column, i) => {
      if (column) row[column] = (cells[i] ?? '').trim();
    });
    return row;
  });
}

/** Splits text into records and cells, respecting quotes. */
function splitRecords(text: string, delimiter: string): string[][] {
  const records: string[][] = [];
  let cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      cells.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      cells.push(cell);
      records.push(cells);
      cells = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || cells.length > 0) {
    cells.push(cell);
    records.push(cells);
  }
  return records;
}
