/**
 * The columns of a student import sheet (ADR-0031), in the template's order, with what to
 * write in each. Used by the template download, the import page's column list and the import
 * action. Where the students go (branch, year, section) is chosen on the screen, not in the
 * sheet. `admissionNo` is only in the sheet when the organization types admission numbers.
 * The API checks every value with the same rules as the "Add student" form.
 */
export interface ImportColumn {
  name: string;
  required?: boolean;
  /** Only when admission numbers are typed in (MANUAL). */
  manualOnly?: boolean;
  help: string;
  /** The value in the template's example row. */
  example: string;
}

export const IMPORT_COLUMNS: ImportColumn[] = [
  {
    name: 'admissionNo',
    required: true,
    manualOnly: true,
    help: 'Unique in the organization',
    example: 'SVJC260001',
  },
  {
    name: 'admissionDate',
    required: true,
    help: '2026-06-01 or 01/06/2026',
    example: '2026-06-01',
  },
  {
    name: 'fullName',
    required: true,
    help: "As in official records; letters, spaces, . ' -",
    example: 'Ravi Teja',
  },
  { name: 'surname', help: 'Letters only', example: 'Kumar' },
  {
    name: 'dateOfBirth',
    required: true,
    help: '3 to 30 years old at admission',
    example: '2010-05-14',
  },
  { name: 'gender', required: true, help: 'male / female / other (or M / F)', example: 'male' },
  { name: 'bloodGroup', help: 'A+, A-, B+, B-, AB+, AB-, O+, O-', example: 'B+' },
  {
    name: 'phone',
    help: '10-digit mobile (6-9 first); +91 and spaces are fine',
    example: '9876543210',
  },
  { name: 'alternatePhone', help: '10-digit mobile', example: '' },
  { name: 'email', help: 'A valid email', example: '' },
  { name: 'address', help: 'Where the student lives now', example: 'Gajuwaka, Visakhapatnam' },
  { name: 'permanentAddress', help: '', example: '' },
  { name: 'area', help: 'Locality', example: 'Gajuwaka' },
  { name: 'aadhaar', help: '12 digits with a valid check digit; unique (sensitive)', example: '' },
  { name: 'category', help: 'OC, BC-A … BC-E, SC, ST, EWS, Other (sensitive)', example: 'BC-D' },
  { name: 'subCaste', help: '(sensitive)', example: '' },
  { name: 'residence', help: 'Day scholar / Hosteller', example: 'Day scholar' },
  { name: 'busFacility', help: 'yes / no', example: 'yes' },
  { name: 'pickupPoint', help: 'Required when busFacility is yes', example: 'Gajuwaka bus stop' },
  { name: 'previousInstitution', help: 'Previous school / college', example: '' },
  { name: 'previousBoard', help: 'SSC, CBSE, ICSE, Intermediate, IB, Other', example: 'SSC' },
  { name: 'hallTicketNo', help: 'Letters, digits, / -', example: '' },
  { name: 'previousPercentage', help: '0 to 100', example: '92.5' },
  { name: 'previousGrade', help: 'GPA or grade, e.g. 9.2 or A1', example: '' },
  { name: 'admissionTestNo', help: 'Admission / scholarship test number', example: '' },
  { name: 'admissionTestMarks', help: '0 to 1000', example: '' },
  { name: 'medicalCondition', help: '(sensitive)', example: '' },
  { name: 'remarks', help: '', example: '' },
  { name: 'topRanker', help: 'yes / no (or active / inactive)', example: 'no' },
  { name: 'learnerLevel', help: 'Expert, Medium, Slow', example: '' },
  { name: 'rollNo', help: 'Unique in the section', example: '1' },
  {
    name: 'fatherName',
    help: 'The first parent given is the main contact',
    example: 'Ramesh Kumar',
  },
  { name: 'fatherPhone', help: '10-digit mobile', example: '9876543211' },
  { name: 'fatherOccupation', help: '', example: 'Farmer' },
  { name: 'motherName', help: '', example: 'Lakshmi' },
  { name: 'motherPhone', help: '', example: '' },
  { name: 'motherOccupation', help: '', example: '' },
  { name: 'guardianName', help: 'Someone other than the parents', example: '' },
  { name: 'guardianPhone', help: '', example: '' },
  { name: 'guardianOccupation', help: '', example: '' },
];

/** The columns for this organization: without admissionNo when numbers are automatic. */
export function importColumnsFor(numbering: 'AUTOMATIC' | 'MANUAL'): ImportColumn[] {
  return IMPORT_COLUMNS.filter((c) => !c.manualOnly || numbering === 'MANUAL');
}

/** The columns in groups, for the import page's column guide (same order as the template). */
const COLUMN_GROUPS: [string, string[]][] = [
  ['Admission', ['admissionNo', 'admissionDate', 'rollNo']],
  ['Student', ['fullName', 'surname', 'dateOfBirth', 'gender', 'bloodGroup']],
  ['Contact', ['phone', 'alternatePhone', 'email', 'address', 'permanentAddress', 'area']],
  ['Identity and category (sensitive)', ['aadhaar', 'category', 'subCaste']],
  ['Stay and transport', ['residence', 'busFacility', 'pickupPoint']],
  [
    'Previous education',
    ['previousInstitution', 'previousBoard', 'hallTicketNo', 'previousPercentage', 'previousGrade'],
  ],
  ['Admission test', ['admissionTestNo', 'admissionTestMarks']],
  ['Health, notes and ranking', ['medicalCondition', 'remarks', 'topRanker', 'learnerLevel']],
  [
    'Parents',
    [
      'fatherName',
      'fatherPhone',
      'fatherOccupation',
      'motherName',
      'motherPhone',
      'motherOccupation',
      'guardianName',
      'guardianPhone',
      'guardianOccupation',
    ],
  ],
];

/** `columns` (e.g. from importColumnsFor) in their groups; empty groups are left out. */
export function groupedColumns(
  columns: ImportColumn[],
): { title: string; columns: ImportColumn[] }[] {
  const byName = new Map(columns.map((c) => [c.name, c]));
  return COLUMN_GROUPS.map(([title, names]) => ({
    title,
    columns: names.map((n) => byName.get(n)).filter((c): c is ImportColumn => !!c),
  })).filter((g) => g.columns.length > 0);
}
