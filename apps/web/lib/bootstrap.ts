/**
 * What the web app knows about the signed-in user: who they are, which organization and
 * institution they act in, which modules are switched on, and what they may do.
 *
 * In Phase 2 this comes from GET /api/v1/me/bootstrap (docs/05-module-catalog.md §5.6), and
 * these types are replaced by the generated contract types. Until that endpoint exists,
 * getBootstrap() returns SAMPLE data so the layout and navigation can be built and tried.
 */
import 'server-only';

export interface BootstrapNavigationItem {
  path: string;
  label: string;
  /** Shown only if the user has this permission. */
  permission: string;
  /** Shown only if this variant of the module is active here (e.g. biometric attendance). */
  variant?: string;
}

export interface BootstrapModule {
  key: string;
  name: string;
  category: 'platform' | 'academics' | 'administration';
  /** Variants active for the user's current institution / campus. */
  activeVariants: string[];
  navigation: BootstrapNavigationItem[];
}

export interface Bootstrap {
  user: { id: string; displayName: string; roleSummary: string };
  organization: { id: string; displayName: string };
  institution: { id: string; name: string } | null;
  /** Modules the organization is entitled to AND that are switched on. */
  modules: BootstrapModule[];
  /** Permission keys the user holds (scopes are checked by the API, not here). */
  permissions: string[];
}

/** Sample data. Replaced by the real API call in Phase 2 step 3. */
const SAMPLE: Bootstrap = {
  user: { id: 'sample-user', displayName: 'Lakshmi Rao', roleSummary: 'Institution admin' },
  organization: { id: 'sample-org', displayName: 'Demo Educational Society' },
  institution: { id: 'sample-institution', name: 'Demo Junior College' },
  modules: [
    {
      key: 'academic',
      name: 'Academic',
      category: 'academics',
      activeVariants: ['junior_college_v1'],
      navigation: [
        { path: '/academic', label: 'Academic structure', permission: 'academic.structure.view' },
      ],
    },
    {
      key: 'students',
      name: 'Students',
      category: 'academics',
      activeVariants: ['manual'],
      navigation: [{ path: '/students', label: 'Students', permission: 'students.student.view' }],
    },
    {
      key: 'attendance',
      name: 'Attendance',
      category: 'academics',
      // Only manual marking is active here, so the "Devices" item stays hidden.
      activeVariants: ['manual'],
      navigation: [
        { path: '/attendance', label: 'Attendance', permission: 'attendance.record.view' },
        {
          path: '/attendance/devices',
          label: 'Devices',
          permission: 'attendance.device.manage',
          variant: 'biometric',
        },
      ],
    },
    {
      key: 'access',
      name: 'Users and roles',
      category: 'administration',
      activeVariants: [],
      navigation: [
        { path: '/users', label: 'Users', permission: 'access.user.view' },
        { path: '/roles', label: 'Roles', permission: 'access.role.manage' },
      ],
    },
    {
      key: 'audit',
      name: 'Audit log',
      category: 'administration',
      activeVariants: [],
      navigation: [{ path: '/audit', label: 'Audit log', permission: 'audit.log.view' }],
    },
  ],
  permissions: [
    'academic.structure.view',
    'students.student.view',
    'attendance.record.view',
    'attendance.device.manage',
    'access.user.view',
    'access.role.manage',
    'audit.log.view',
  ],
};

export async function getBootstrap(): Promise<Bootstrap> {
  return SAMPLE;
}
