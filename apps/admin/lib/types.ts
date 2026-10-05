/**
 * The shapes of the API's answers used by the super admin console.
 * See all of them in Swagger: http://localhost:3000/api/docs
 */

export interface Me {
  type: 'super_admin' | 'user';
  id: string;
  name: string;
  email: string;
}

export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: OrganizationStatus;
  createdAt: string;
}

export interface OrganizationListItem extends Organization {
  _count: { users: number; institutions: number };
}

export interface Module {
  key: string;
  name: string;
  description: string;
  dependsOn: string[];
}

export interface OrganizationDetail extends Organization {
  _count: { users: number; institutions: number; campuses: number; roles: number };
  admins: { id: string; name: string; email: string; status: string; lastLoginAt: string | null }[];
  /** Only the super admin adds and deletes institutions (ADR-0025). */
  institutions: { id: string; name: string; code: string; _count: { campuses: number } }[];
  modules: (Module & { enabled: boolean })[];
}

export interface Dashboard {
  organizations: { total: number; active: number; suspended: number };
  users: number;
  institutions: number;
  recentOrganizations: Organization[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** A predefined role (Director, Principal, ...): the same in every organization. */
export interface PredefinedRole {
  key: string;
  name: string;
  description: string;
  permissions: string[];
  /** false = given from a student's record, not the Users page (Parent, Student). */
  assignable: boolean;
}

/** What a form's server action returns: a message to show, or nothing. */
export type { FormState, PermissionResource } from '@eduplatform/ui';
