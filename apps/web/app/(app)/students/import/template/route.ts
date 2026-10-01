/**
 * /students/import/template: a CSV file with the import columns and one example row,
 * to open in Excel and fill in.
 */
const TEMPLATE = [
  'admissionNo,admissionDate,fullName,surname,dateOfBirth,gender,phone,email,address,batch,section,rollNo,guardianName,guardianRelation,guardianPhone',
  'SVJC260001,2026-06-01,Ravi Teja,Kumar,2010-05-14,male,9876543210,,Kukatpally Hyderabad,B2026,Y1/MPC/A,1,Ramesh Kumar,father,9876543211',
].join('\r\n');

export function GET() {
  // \uFEFF at the start tells Excel the file is UTF-8 (names with accents stay readable).
  return new Response(`\uFEFF${TEMPLATE}\r\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="students-import-template.csv"',
    },
  });
}
