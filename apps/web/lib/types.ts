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
  roleNames: string[];
  /** Everything the user may do somewhere; `grants` says where. */
  permissions: string[];
  grants: Grant[];
  enabledModules: string[];
}

/** One role of the user and where it applies (no ids = the whole organization). */
export interface Grant {
  roleName: string;
  permissions: string[];
  institutionId: string | null;
  campusId: string | null;
}

/** A place in the organization: {} = the whole organization. */
export interface Place {
  institutionId?: string | null;
  campusId?: string | null;
}

export interface Dashboard {
  institutions: number;
  campuses: number;
  users: number;
  activeUsers: number;
  roles: number;
}

export interface OwnOrganization {
  id: string;
  name: string;
  slug: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  modules: { key: string; name: string }[];
}

export const INSTITUTION_TYPES = {
  JUNIOR_COLLEGE: 'Junior college',
  DEGREE_COLLEGE: 'Degree college',
  ENGINEERING_COLLEGE: 'Engineering college',
  SCHOOL: 'School',
} as const;
export type InstitutionType = keyof typeof INSTITUTION_TYPES;

export interface Campus {
  id: string;
  institutionId: string;
  name: string;
  code: string;
}

export interface Institution {
  id: string;
  name: string;
  code: string;
  type: InstitutionType;
  /** Only the campuses the user may see. */
  campuses: { id: string; name: string; code: string }[];
  /** Students module: how admission numbers are made, e.g. "{CODE}{YY}{SEQ:4}"; null = by hand. */
  admissionNoPattern?: string | null;
  /** Attendance: the institution's time zone and correction window (days). */
  timeZone?: string;
  attendanceCorrectionDays?: number;
  _count: { campuses: number };
}

export interface InstitutionDetail extends Omit<Institution, '_count' | 'campuses'> {
  campuses: Campus[];
}

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  /** Each role with its place: neither institution nor campus = the whole organization. */
  roles: RoleAssignment[];
}

export interface RoleAssignment {
  id: string;
  role: { id: string; name: string };
  institution: { id: string; name: string } | null;
  campus: { id: string; name: string } | null;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  /** true = the same in every organization; only EduPlatform can change it. */
  predefined: boolean;
  /** false = can't be given from the Users page (Parent, Student). */
  assignable: boolean;
  _count: { users: number };
}

export interface AuditLog {
  id: string;
  actorType: string;
  actorId: string;
  actorName: string | null;
  institutionId: string | null;
  campusId: string | null;
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
  institutionId: string;
  institution: { id: string; name: string };
  name: string;
  startsOn: string;
  endsOn: string;
  status: AcademicYearStatus;
}

/** One level of an institution's classes, e.g. { position: 2, name: 'Group' }. */
export interface ClassLevel {
  id: string;
  position: number;
  name: string;
}

export interface ClassItem {
  id: string;
  parentId: string | null;
  level: number;
  name: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
}

/** GET /campuses/:id/classes */
export interface CampusClasses {
  campus: {
    id: string;
    name: string;
    institutionId: string;
    institution: { id: string; name: string };
  };
  levels: ClassLevel[];
  classes: ClassItem[];
}

export interface Batch {
  id: string;
  institutionId: string;
  institution: { id: string; name: string };
  name: string;
  code: string;
  stage: string;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface Subject {
  id: string;
  institutionId: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface SubjectListItem extends Subject {
  institution: { id: string; name: string };
  _count: { classes: number };
}

/** GET /classes/:id/subjects */
export interface ClassSubjects {
  class: { id: string; name: string; code: string; campusId: string };
  /** The classes above this one, top first. */
  path: { id: string; name: string }[];
  own: Subject[];
  inherited: { subject: Subject; from: { id: string; name: string } }[];
  /** The institution's subjects in use, to choose from. */
  available: Subject[];
}

export interface Holiday {
  id: string;
  institutionId: string;
  campusId: string | null;
  campus: { id: string; name: string } | null;
  name: string;
  startsOn: string;
  endsOn: string;
}

/** GET /calendar */
export interface Calendar {
  institutions: { id: string; name: string; weeklyOffDays: number[] }[];
  holidays: Holiday[];
}

// --- Students module -----------------------------------------------------------------------------

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNDISCLOSED';
export type StudentStatus = 'ACTIVE' | 'TRANSFERRED' | 'DISCONTINUED' | 'ALUMNI';
export type GuardianRelation = 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';

/** A section name with its parent, e.g. { name: 'Section A', parent: { name: 'MPC' } }. */
export interface SectionRef {
  id: string;
  name: string;
  parent: { name: string } | null;
}

export interface StudentListItem {
  id: string;
  admissionNo: string;
  fullName: string;
  surname: string | null;
  gender: Gender;
  phone: string | null;
  status: StudentStatus;
  campus: { id: string; name: string };
  batch: { id: string; name: string; stage: string } | null;
  enrolments: {
    rollNo: string | null;
    academicYear: { id: string; name: string };
    class: SectionRef;
  }[];
}

export interface Guardian {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  occupation: string | null;
}

export interface Enrolment {
  id: string;
  rollNo: string | null;
  status: 'ACTIVE' | 'PROMOTED' | 'COMPLETED' | 'LEFT';
  academicYear: { id: string; name: string; status: AcademicYearStatus };
  class: SectionRef;
}

export interface StudentProfile {
  id: string;
  institutionId: string;
  campusId: string;
  institution: { id: string; name: string };
  campus: { id: string; name: string };
  admissionNo: string;
  admissionDate: string;
  fullName: string;
  surname: string | null;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: StudentStatus;
  batchId: string | null;
  batch: { id: string; name: string; stage: string } | null;
  guardians: { id: string; relation: GuardianRelation; isPrimary: boolean; guardian: Guardian }[];
  enrolments: Enrolment[];
  statusChanges: {
    id: string;
    fromStatus: StudentStatus | null;
    toStatus: StudentStatus;
    effectiveOn: string;
    reason: string | null;
  }[];
}

/** GET /promotions/preview */
export interface PromotionPreview {
  campus: { id: string; name: string };
  fromYear: { id: string; name: string };
  toYear: { id: string; name: string };
  rows: {
    from: { id: string; label: string };
    suggestion: { kind: 'section'; sectionId: string } | { kind: 'graduate' } | { kind: 'choose' };
    students: { id: string; fullName: string; admissionNo: string; rollNo: string | null }[];
    alreadyPlaced: number;
  }[];
  sections: { id: string; label: string }[];
}

/** GET /promotions?campusId= : promotions applied on a campus, newest first. */
export interface PromotionRun {
  id: string;
  fromYear: string;
  toYear: string;
  promoted: number;
  graduated: number;
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
  section: { id: string; name: string; campusId: string };
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
  campus: { id: string; name: string };
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
