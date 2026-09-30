/**
 * The shapes of the API's answers used by the web app.
 * See all of them in Swagger: http://localhost:3000/api/docs
 */
export type { FormState } from '@eduplatform/ui';

/** GET /auth/me: who is logged in, their permissions and their organization's modules. */
export interface Me {
  type: 'super_admin' | 'user';
  id: string;
  name: string;
  email: string;
  organizationId: string | null;
  roleName: string | null;
  permissions: string[];
  enabledModules: string[];
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
  _count: { campuses: number };
}

export interface InstitutionDetail extends Omit<Institution, '_count'> {
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
  role: { id: string; name: string };
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  _count?: { users: number };
}

/** GET /permissions: every permission, and whether the organization's modules allow it. */
export interface Permission {
  key: string;
  module: string | null;
  group: string;
  description: string;
  available: boolean;
}

export interface AuditLog {
  id: string;
  actorType: string;
  actorId: string;
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
