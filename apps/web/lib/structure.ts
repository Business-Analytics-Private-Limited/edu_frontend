/**
 * What the section picker (components/section-picker.tsx) needs, loaded on the server:
 *
 *   const picker = await pickerData(branchIds);
 *   <SectionPicker {...picker} branches={branches} name="classId" />
 *
 * The structure above sections (the organization's) and the sections of the given branches.
 */
import 'server-only';
import { api } from './api';
import type { BranchSections, ClassItem, Section, Structure } from './types';

export async function pickerData(branchIds: string[]) {
  const [structure, ...perBranch] = await Promise.all([
    api<Structure>('/academic-structure'),
    ...branchIds.map((id) => api<BranchSections>(`/branches/${id}/sections`)),
  ]);
  const sections: Section[] = perBranch.flatMap((b) => b.sections);
  return { levels: structure.levels, classes: structure.classes, sections };
}

/**
 * Every class above sections with its path ("Junior › MPC › JEE Mains"), in tree order. The
 * hidden "whole course" level (ADR-0033) is not listed and left out of the names.
 */
export function classPaths(classes: ClassItem[]): { id: string; label: string }[] {
  const byOrder = (a: ClassItem, b: ClassItem) =>
    a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
  const out: { id: string; label: string }[] = [];
  const walk = (parentId: string | null, prefix: string) => {
    for (const c of classes.filter((x) => x.parentId === parentId).sort(byOrder)) {
      if (c.placeholder) {
        walk(c.id, prefix);
        continue;
      }
      const label = prefix ? `${prefix} › ${c.name}` : c.name;
      out.push({ id: c.id, label });
      walk(c.id, label);
    }
  };
  walk(null, '');
  return out;
}
