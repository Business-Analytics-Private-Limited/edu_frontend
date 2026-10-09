/**
 * /students/import/template: a CSV file with the import columns and one example row, to open in
 * Excel and fill in. Where the students go (branch, section) is chosen on the import screen, not
 * in the file (ADR-0030).
 */
const TEMPLATE = [
  'admissionNo,admissionDate,fullName,surname,dateOfBirth,gender,phone,email,address,previousInstitution,previousMarks,rollNo,guardianName,guardianRelation,guardianPhone',
  'SVJC260001,2026-06-01,Ravi Teja,Kumar,2010-05-14,male,9876543210,,Kukatpally Hyderabad,,,1,Ramesh Kumar,father,9876543211',
].join('\r\n');

export function GET() {
  // A byte-order mark at the start tells Excel the file is UTF-8 (accents stay readable).
  const bom = String.fromCharCode(0xfeff);
  return new Response(`${bom}${TEMPLATE}\r\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="students-import-template.csv"',
    },
  });
}
