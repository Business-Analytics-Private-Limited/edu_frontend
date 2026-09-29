/**
 * The super admin console's menu: the v1 screens of docs/05-module-catalog.md §5.7.
 * Fixed, unlike the web app's menu: platform staff always see the same console, and the API
 * checks their platform role on every request.
 */
import type { NavSection } from '@eduplatform/ui';
import {
  Blocks,
  Building2,
  Cpu,
  Flag,
  Gauge,
  LayoutDashboard,
  Layers,
  ShieldCheck,
  UserRoundCog,
} from 'lucide-react';

export const ADMIN_NAVIGATION: NavSection[] = [
  { items: [{ href: '/', label: 'Overview', icon: <LayoutDashboard /> }] },
  {
    title: 'Tenants',
    items: [
      { href: '/organizations', label: 'Organizations', icon: <Building2 /> },
      { href: '/entitlements', label: 'Entitlements', icon: <Blocks /> },
      { href: '/plans', label: 'Plans', icon: <Layers /> },
      { href: '/usage', label: 'Usage', icon: <Gauge /> },
    ],
  },
  {
    title: 'Platform',
    items: [
      { href: '/feature-flags', label: 'Feature flags', icon: <Flag /> },
      { href: '/role-templates', label: 'Role templates', icon: <ShieldCheck /> },
      { href: '/devices', label: 'Devices', icon: <Cpu /> },
      { href: '/impersonation', label: 'Impersonation', icon: <UserRoundCog /> },
    ],
  },
];
