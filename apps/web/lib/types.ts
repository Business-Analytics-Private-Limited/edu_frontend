/**
 * The shapes of the API's answers used by the web app.
 * See all of them in Swagger: http://localhost:3000/api/docs
 */
export type { FormState, PermissionResource } from '@eduplatform/ui';

/**
 * GET /auth/me: who is logged in, their roles, their permissions (everything any of their
 * roles allows) and their organization's modules.
 */
export interface Me {
  type: 'super_admin' | 'user';
  id: string;
  name: string;
  email: string;
  organizationId: string | null;
  /** "staff" uses the web app; "parent" / "student" use the portal (app/portal). */
  kind: 'staff' | 'parent' | 'student' | null;
  /** Portal logins: the students they may see. */
  studentIds: string[];
  roleNames: string[];
  /** Everything the user may do somewhere; `grants` says where. */
  permissions: string[];
  grants: Grant[];
  /** A temporary password that must be changed first (ADR-0028): see /change-password. */
  mustChangePassword: boolean;
  /** Has the Organization admin role for the whole organization. */
  isOrganizationAdmin: boolean;
  enabledModules: string[];
}

/** One role of the user and where it applies (no branch = the whole organization). */
export interface Grant {
  roleName: string;
  permissions: string[];
  branchId: string | null;
}

/** A place in the organization (ADR-0030): {} = the whole organization, or one branch. */
export interface Place {
  branchId?: string | null;
}

export interface Dashboard {
  /** Active ones; closed ones are counted separately (ADR-0026). */
  branches: number;
  inactiveBranches: number;
  users: number;
  activeUsers: number;
  roles: number;
  /** With the Students module: current students and those who left (outgoing). */
  students: { current: number; outgoing: number } | null;
}

/** What kind of institution the organization is: decides its academic structure (ADR-0030). */
export type OrganizationType = 'SCHOOL' | 'INTERMEDIATE' | 'DEGREE' | 'ENGINEERING';
export type AdmissionNumbering = 'AUTOMATIC' | 'MANUAL';

export interface OwnOrganization {
  id: string;
  name: string;
  slug: string;
  code: string;
  type: OrganizationType;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  /** The structure's level names, top to bottom, e.g. ["Year", "Group", "Stream", "Section"]. */
  levelNames: string[];
  /** Which level (1 = top) is the year of study (promotion moves students from one to the next). */
  yearLevel: number;
  weeklyOffDays: number[];
  timeZone: string;
  attendanceCorrectionDays: number;
  admissionNumbering: AdmissionNumbering;
  admissionNoPattern: string | null;
  modules: { key: string; name: string }[];
}

/** INACTIVE = closed: records stay readable, nothing new happens there (ADR-0026). */
export type PlaceStatus = 'ACTIVE' | 'INACTIVE';

/** A location of the organization (ADR-0030). Added and closed by EduPlatform only. */
export interface Branch {
  id: string;
  name: string;
  code: string;
  status: PlaceStatus;
  /** GET /branches: its current students. */
  students?: number;
}

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  /** Each role with its place: no branch = the whole organization. */
  roles: RoleAssignment[];
}

export interface RoleAssignment {
  id: string;
  role: { id: string; name: string };
  branch: { id: string; name: string } | null;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  /** true = every organization has it, kept up to date by EduPlatform unless customized. */
  predefined: boolean;
  /** false = can't be given from the Users page (Parent, Student). */
  assignable: boolean;
  /** Its permissions can be changed (all but Organization admin, Parent, Student). */
  editable: boolean;
  /** A predefined role whose permissions this organization changed (ADR-0029). */
  customized: boolean;
  /** EduPlatform's current permissions for a predefined role; null for own roles. */
  defaultPermissions: string[] | null;
  _count: { users: number };
}

export interface AuditLog {
  id: string;
  actorType: string;
  actorId: string | null;
  actorName: string | null;
  branchId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Academic module -----------------------------------------------------------------------------

export type AcademicYearStatus = 'PLANNED' | 'ACTIVE' | 'CLOSED';

export interface AcademicYear {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  status: AcademicYearStatus;
}

/** A class of the academic structure: a year, group, stream, course ... or a section. */
export interface ClassItem {
  id: string;
  parentId: string | null;
  /** Only for sections: their branch. */
  branchId: string | null;
  level: number;
  name: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
  builtIn: boolean;
  longTerm: boolean;
  /**
   * Degree / Engineering: the hidden "whole course" level of a course without specializations
   * (ADR-0033); left out of names ("B.Com › 1st Year").
   */
  placeholder: boolean;
  /** Year-level classes: where students go at promotion; null = they complete. */
  nextClassId: string | null;
}

/** GET /academic-structure: everything above sections, for the whole organization. */
export interface Structure {
  type: OrganizationType;
  levels: string[];
  yearLevel: number;
  sectionLevel: number;
  classes: ClassItem[];
  /** School: the classes to tick; Intermediate: the groups to switch on. */
  builtIn: { code: string; name: string; enabled: boolean }[];
  /** Intermediate: the groups each branch runs, { branchId: ["MPC", "BIPC"] } (ADR-0032). */
  branchGroups: Record<string, string[]>;
  /** How many sections (in every branch) are under each class. */
  sectionCounts: Record<string, number>;
}

/** A section with its place in the structure, e.g. path "Junior (1st Year) › MPC › JEE Mains". */
export interface Section extends ClassItem {
  path: string;
}

/** GET /branches/:id/sections */
export interface BranchSections {
  branch: { id: string; name: string; status: PlaceStatus };
  sections: Section[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface SubjectListItem extends Subject {
  _count: { classes: number };
}

/** GET /classes/:id/subjects */
export interface ClassSubjects {
  class: { id: string; name: string; code: string; branchId: string | null };
  /** The classes above this one, top first. */
  path: { id: string; name: string }[];
  own: Subject[];
  inherited: { subject: Subject; from: { id: string; name: string } }[];
  /** The organization's subjects in use, to choose from. */
  available: Subject[];
}

export interface Holiday {
  id: string;
  branchId: string | null;
  branch: { id: string; name: string } | null;
  name: string;
  startsOn: string;
  endsOn: string;
}

/** GET /calendar */
export interface Calendar {
  weeklyOffDays: number[];
  holidays: Holiday[];
}

// --- Students module -----------------------------------------------------------------------------

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNDISCLOSED';
/** ACTIVE = current; the others are OUTGOING (ADR-0030). */
export type StudentStatus = 'ACTIVE' | 'TRANSFERRED' | 'DISCONTINUED' | 'COMPLETED';
export type GuardianRelation = 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';
export type EnrolmentStatus = 'ACTIVE' | 'MOVED' | 'PROMOTED' | 'COMPLETED' | 'LEFT';
export type ReservationCategory =
  'OC' | 'BC_A' | 'BC_B' | 'BC_C' | 'BC_D' | 'BC_E' | 'SC' | 'ST' | 'EWS' | 'OTHER';
export type Residence = 'DAY_SCHOLAR' | 'HOSTELLER';
export type PreviousBoard = 'SSC' | 'CBSE' | 'ICSE' | 'INTERMEDIATE' | 'IB' | 'OTHER';
export type LearnerLevel = 'EXPERT' | 'MEDIUM' | 'SLOW';

export interface StudentListItem {
  id: string;
  admissionNo: string;
  fullName: string;
  surname: string | null;
  gender: Gender;
  phone: string | null;
  status: StudentStatus;
  topRanker: boolean;
  learnerLevel: LearnerLevel | null;
  branch: { id: string; name: string };
  /** The latest placement, as text. */
  placement: {
    academicYear: { id: string; name: string };
    section: string;
    rollNo: string | null;
    status: EnrolmentStatus;
  } | null;
}

export interface Guardian {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  occupation: string | null;
}

/** A placement period (ADR-0030): one section of one branch, from enrolledOn until endedOn. */
export interface Enrolment {
  id: string;
  classId: string;
  rollNo: string | null;
  status: EnrolmentStatus;
  enrolledOn: string;
  endedOn: string | null;
  reason: string | null;
  academicYear: { id: string; name: string; status: AcademicYearStatus };
  branch: { id: string; name: string };
  /** "Junior (1st Year) › MPC › JEE Mains › JEE-A" */
  section: string;
  path: { id: string; name: string; level: number }[];
}

export interface StatusChange {
  id: string;
  fromStatus: StudentStatus | null;
  toStatus: StudentStatus;
  effectiveOn: string;
  reason: string | null;
  destination: string | null;
  changedAt: string;
}

export interface StudentProfile {
  id: string;
  branchId: string;
  branch: { id: string; name: string; status: PlaceStatus };
  admissionNo: string;
  admissionDate: string;
  fullName: string;
  surname: string | null;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup: string | null;
  phone: string | null;
  alternatePhone: string | null;
  email: string | null;
  address: string | null;
  permanentAddress: string | null;
  area: string | null;
  /** SENSITIVE: masked (XXXX-XXXX-1234) when sensitiveVisible is false. */
  aadhaar: string | null;
  /** SENSITIVE: null when sensitiveVisible is false. */
  category: ReservationCategory | null;
  subCaste: string | null;
  medicalCondition: string | null;
  /** Whether this user may see the sensitive details ("students.sensitive.view"). */
  sensitiveVisible: boolean;
  residence: Residence | null;
  busFacility: boolean;
  pickupPoint: string | null;
  previousInstitution: string | null;
  previousBoard: PreviousBoard | null;
  hallTicketNo: string | null;
  /** Decimals arrive as text, e.g. "91.5". */
  previousPercentage: string | null;
  previousGrade: string | null;
  admissionTestNo: string | null;
  admissionTestMarks: string | null;
  remarks: string | null;
  topRanker: boolean;
  learnerLevel: LearnerLevel | null;
  /** The import that admitted the student, and the row in its sheet. */
  importedFrom: { id: string; code: string; row: number | null } | null;
  status: StudentStatus;
  guardians: {
    id: string;
    relation: GuardianRelation;
    isPrimary: boolean;
    guardian: Guardian & { login: PortalLogin | null };
  }[];
  /** The student's own portal login. */
  login: PortalLogin | null;
  /** Newest first. */
  enrolments: Enrolment[];
  statusChanges: StatusChange[];
}

/** A row left out of an import, and why (ADR-0031). */
export interface ExcludedRow {
  row: number;
  admissionNo: string | null;
  fullName: string | null;
  reasons: string[];
  /** The row as written in the sheet (sensitive values hidden without the permission). */
  values: Record<string, string>;
}

/** POST /students/import */
export interface ImportResult {
  dryRun: boolean;
  total: number;
  importable: number;
  excludedCount: number;
  imported: number;
  excluded: ExcludedRow[];
  run: { id: string; code: string } | null;
}

/** GET /students/imports: an import record. */
export interface ImportRun {
  id: string;
  code: string;
  number: number;
  fileName: string | null;
  totalRows: number;
  importedCount: number;
  excludedCount: number;
  branchId: string;
  branchName: string | null;
  academicYearName: string | null;
  section: string;
  importedByName: string | null;
  createdAt: string;
}

/** GET /students/imports/:id */
export interface ImportRunDetail extends ImportRun {
  excludedRows: ExcludedRow[];
  students: {
    id: string;
    admissionNo: string;
    fullName: string;
    importRow: number | null;
    status: StudentStatus;
    /** Optional details still empty, e.g. ["phone", "parent / guardian"]. */
    missing: string[];
  }[];
}

/** GET /promotions/preview */
export interface PromotionPreview {
  branch: { id: string; name: string };
  fromYear: { id: string; name: string };
  toYear: { id: string; name: string };
  rows: {
    from: { id: string; label: string };
    suggestion: { kind: 'section'; sectionId: string } | { kind: 'complete' } | { kind: 'choose' };
    students: { id: string; fullName: string; admissionNo: string; rollNo: string | null }[];
    alreadyPlaced: number;
  }[];
  sections: { id: string; label: string }[];
}

/** GET /promotions?branchId= : promotions applied at a branch, newest first. */
export interface PromotionRun {
  id: string;
  fromYear: string;
  toYear: string;
  promoted: number;
  completed: number;
  students: number;
  createdAt: string;
  undoneAt: string | null;
}

// --- Attendance module ---------------------------------------------------------------------------

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE';
export type AttendanceCounts = Record<AttendanceStatus, number>;

/** GET /attendance/roster */
export interface Roster {
  date: string;
  today: string;
  section: { id: string; name: string; label: string; branchId: string };
  academicYear: { id: string; name: string } | null;
  workingDay: boolean;
  reason: string | null;
  marked: boolean;
  lastMarkedBy: { name: string; at: string } | null;
  /** Why the day can't be marked, or null. */
  blocked: string | null;
  students: {
    studentId: string;
    fullName: string;
    admissionNo: string;
    rollNo: string | null;
    status: AttendanceStatus | null;
    remark: string | null;
    corrected: boolean;
  }[];
}

/** GET /attendance/daily-summary */
export interface DailySummary {
  date: string;
  today: string;
  branch: { id: string; name: string };
  academicYear: { id: string; name: string } | null;
  workingDay: boolean;
  reason: string | null;
  sections: {
    section: { id: string; name: string };
    students: number;
    marked: boolean;
    counts: AttendanceCounts;
  }[];
}

/** GET /attendance/section-report */
export interface SectionReport {
  section: { id: string; name: string };
  from: string;
  to: string;
  workingDays: number;
  markedDays: number;
  unmarkedDays: number;
  students: {
    studentId: string;
    fullName: string;
    admissionNo: string;
    rollNo: string | null;
    counts: AttendanceCounts;
    percentage: number | null;
  }[];
}

/** GET /students/:id/attendance */
export interface StudentAttendance {
  from: string;
  to: string;
  counts: AttendanceCounts;
  percentage: number | null;
  days: {
    date: string;
    status: AttendanceStatus;
    remark: string | null;
    corrected: boolean;
    correctionReason: string | null;
  }[];
}

// --- Parent and student portal -------------------------------------------------------------------

export interface PortalLogin {
  id: string;
  email: string;
  status: UserStatus;
}

/** What a parent or student sees of a student. */
export interface PortalStudent {
  id: string;
  fullName: string;
  surname: string | null;
  admissionNo: string;
  dateOfBirth: string;
  status: StudentStatus;
  organization: { name: string };
  branch: { name: string };
  placement: { academicYear: string; section: string; rollNo: string | null } | null;
  guardians?: {
    relation: GuardianRelation;
    isPrimary: boolean;
    guardian: { fullName: string; phone: string | null };
  }[];
}

/** GET /portal/me */
export interface PortalMe {
  name: string;
  kind: 'parent' | 'student';
  attendance: boolean;
  students: PortalStudent[];
}

/** GET /portal/students/:id/attendance */
export interface PortalAttendance {
  from: string;
  to: string;
  counts: AttendanceCounts;
  percentage: number | null;
  days: { date: string; status: AttendanceStatus; remark: string | null }[];
}

// --- Student documents ---------------------------------------------------------------------------

export interface DocumentType {
  id: string;
  name: string;
  isRequired: boolean;
  visibleInPortal: boolean;
  isActive: boolean;
  _count: { documents: number };
}

export interface StudentDocument {
  id: string;
  status: 'UPLOADED' | 'VERIFIED' | 'REJECTED';
  note: string | null;
  uploadedByName: string;
  verifiedByName: string | null;
  verifiedAt: string | null;
  createdAt: string;
  documentType: { id: string; name: string; visibleInPortal: boolean };
  file: { id: string; originalName: string; mimeType: string; sizeBytes: number };
}

/** GET /students/:id/documents */
export interface StudentDocuments {
  documents: StudentDocument[];
  /** Required types without an (accepted) document yet. */
  missing: { id: string; name: string }[];
}
