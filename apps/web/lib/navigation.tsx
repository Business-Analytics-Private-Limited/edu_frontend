/**
 * Builds the sidebar from the bootstrap data (docs/05-module-catalog.md §5.6):
 * a module's navigation item is shown only when
 *   1. the module is switched on for the organization (it is in bootstrap.modules),
 *   2. the item's variant, if any, is active here (e.g. "Devices" needs biometric attendance),
 *   3. the user holds the item's permission.
 *
 * Hiding is for convenience only: the API checks every request again (CLAUDE.md, rule 3).
 */
import type { NavSection } from '@eduplatform/ui';
import {
  CalendarCheck,
  GraduationCap,
  LayoutDashboard,
  Network,
  ScrollText,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { Bootstrap } from './bootstrap';

/** Icon per navigation path. A path without an entry gets no icon. */
const ICONS: Record<string, ReactNode> = {
  '/': <LayoutDashboard />,
  '/academic': <Network />,
  '/students': <GraduationCap />,
  '/attendance': <CalendarCheck />,
  '/users': <UserCog />,
  '/roles': <ShieldCheck />,
  '/audit': <ScrollText />,
};

const SECTION_TITLES: Record<string, string> = {
  academics: 'Academics',
  administration: 'Administration',
  platform: 'Organization',
};

export function buildNavigation(bootstrap: Bootstrap): NavSection[] {
  const permissions = new Set(bootstrap.permissions);
  const sections = new Map<string, NavSection>();

  for (const module of bootstrap.modules) {
    const items = module.navigation
      .filter((item) => !item.variant || module.activeVariants.includes(item.variant))
      .filter((item) => permissions.has(item.permission))
      .map((item) => ({ href: item.path, label: item.label, icon: ICONS[item.path] }));
    if (items.length === 0) continue;

    const title = SECTION_TITLES[module.category] ?? module.category;
    const section = sections.get(title) ?? { title, items: [] };
    section.items.push(...items);
    sections.set(title, section);
  }

  return [{ items: [{ href: '/', label: 'Dashboard', icon: ICONS['/'] }] }, ...sections.values()];
}
