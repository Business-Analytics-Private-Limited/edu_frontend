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
import type { BranchSections, Section, Structure } from './types';

export async function pickerData(branchIds: string[]) {
  const [structure, ...perBranch] = await Promise.all([
    api<Structure>('/academic-structure'),
    ...branchIds.map((id) => api<BranchSections>(`/branches/${id}/sections`)),
  ]);
  const sections: Section[] = perBranch.flatMap((b) => b.sections);
  return { levels: structure.levels, classes: structure.classes, sections };
}
