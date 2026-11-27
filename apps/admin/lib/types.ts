/**
 * The shapes of the API's answers used by the super admin console.
 * See all of them in Swagger: http://localhost:3000/api/docs
 */

export interface Me {
  type: 'super_admin' | 'user';
  id: string;
  name: string;
  email: string;
  /** The password from the server's settings must be changed first (ADR-0028). */
  mustChangePassword: boolean;
  /** Two-step login: off, set up but not confirmed yet, or on. */
  twoFactor: 'off' | 'pending' | 'on' | null;
}

/** What the authenticator app needs to be set up (two-step login). */
export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  /** A QR code picture (data: URL) to scan with the app. */
  qrCode: string;
}

export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED';

/** What kind of institution an organization is: decides its academic structure (ADR-0030). */
export type OrganizationType = 'SCHOOL' | 'INTERMEDIATE' | 'DEGREE' | 'ENGINEERING';

export const ORGANIZATION_TYPES: Record<OrganizationType, string> = {
  SCHOOL: 'School (Nursery – Class 10)',
  INTERMEDIATE: 'Intermediate college (Junior / Senior, groups, streams)',
  DEGREE: 'Degree college (courses, specializations, years)',
  ENGINEERING: 'Engineering college (B.Tech, branches, years)',
};

export interface Organization {
  id: string;
  name: string;
  slug: string;
  code: string;
  type: OrganizationType;
  levelNames: string[];
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: OrganizationStatus;
  createdAt: string;
}

export interface OrganizationListItem extends Organization {
  _count: { users: number; branches: number };
}

export interface Module {
  key: string;
  name: string;
  description: string;
  dependsOn: string[];
}

export interface OrganizationDetail extends Organization {
  /** classes: the size of its academic structure (the type can change only while it has none). */
  _count: { users: number; branches: number; roles: number; classes: number };
  admins: { id: string; name: string; email: string; status: string; lastLoginAt: string | null }[];
  /** Only the super admin adds, closes and deletes branches (ADR-0030). */
  branches: {
    id: string;
    name: string;
    code: string;
    /** INACTIVE = closed: records stay, nothing new happens there (ADR-0026). */
    status: 'ACTIVE' | 'INACTIVE';
  }[];
  modules: (Module & { enabled: boolean })[];
}

export interface Dashboard {
  organizations: { total: number; active: number; suspended: number };
  users: number;
  branches: number;
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
  /** true = comes with EduPlatform (can't be deleted); false = created in this console. */
  builtIn: boolean;
  /** Organizations that changed this role themselves: your changes don't reach them (ADR-0029). */
  customizedIn: number;
}

/** What a form's server action returns: a message to show, or nothing. */
export type { FormState, PermissionResource, ResetPasswordResult } from '@eduplatform/ui';

/** One entry of the audit log, as the super admin sees it (ADR-0027). */
export interface PlatformAuditEntry {
  id: string;
  organizationId: string | null;
  organizationName: string | null;
  /** "super_admin", "user", or "unknown" (a failed login with an email that belongs to nobody). */
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
