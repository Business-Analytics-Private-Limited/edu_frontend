/**
 * The sections (classes of the last level) of some campuses, as choices for a drop-down:
 *   { id, campusId, label: "1st year › MPC › Section A" }
 * Used by the admission form and the "move to section" form.
 */
import 'server-only';
import { api } from './api';
import type { CampusClasses } from './types';

export interface SectionOption {
  id: string;
  campusId: string;
  label: string;
}

export async function sectionOptions(campusIds: string[]): Promise<SectionOption[]> {
  const campuses = await Promise.all(
    campusIds.map((id) => api<CampusClasses>(`/campuses/${id}/classes`)),
  );
  return campuses.flatMap(({ campus, levels, classes }) => {
    const byId = new Map(classes.map((c) => [c.id, c]));
    const pathOf = (id: string | null): string[] => {
      const c = id ? byId.get(id) : undefined;
      return c ? [...pathOf(c.parentId), c.name] : [];
    };
    return classes
      .filter((c) => c.level === levels.length && c.isActive)
      .map((c) => ({ id: c.id, campusId: campus.id, label: pathOf(c.id).join(' › ') }));
  });
}
