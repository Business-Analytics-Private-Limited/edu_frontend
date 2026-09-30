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
