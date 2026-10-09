'use client';
/**
 * Choosing WHERE a student goes, step by step (ADR-0030): optionally the branch, then the
 * academic structure level by level, then the section. Each list only shows what exists:
 *
 *   Branch:   [KPHB ▾]
 *   Year:     [Junior (1st Year) ▾]
 *   Group:    [MPC ▾]
 *   Stream:   [JEE Mains ▾]
 *   Section:  [JEE-A ▾]        -> sent with the form as `name` (e.g. "classId")
 *
 *   <SectionPicker levels={org.levelNames} classes={structure.classes} sections={sections}
 *                  branches={branches} name="classId" />
 *
 * `classes` is the structure above sections (GET /academic-structure), `sections` the sections
 * of every branch offered (GET /branches/:id/sections). With `branches`, a branch list comes
 * first and is sent as `branchName` (default "branchId"); without it, `sections` are all from one
 * branch. `afterBranch` puts other fields between the branch and the levels (the import's
 * academic year). Used by the admission form, the import, and a student's "change section / branch".
 */
import { Field, Select } from '@eduplatform/ui';
import { type ReactNode, useMemo, useState } from 'react';

interface Node {
  id: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

interface SectionNode extends Node {
  branchId: string | null;
}

export interface SectionPickerProps {
  /** Level names, top to bottom, the last one being the section. */
  levels: string[];
  /** The structure above sections. */
  classes: Node[];
  /** Sections to choose from (of one or more branches). */
  sections: SectionNode[];
  /** Offer a branch first (only these). */
  branches?: { id: string; name: string }[];
  /** Field name of the chosen section. */
  name: string;
  branchName?: string;
  /** Start with this branch / section chosen. */
  defaultBranchId?: string;
  defaultSectionId?: string;
  required?: boolean;
  /** Text of the "nothing chosen" option of the section list (e.g. "Not placed yet"). */
  emptyLabel?: string;
  /** Fields shown right after the branch, before the levels (the import puts the year there). */
  afterBranch?: ReactNode;
}

const byOrder = (a: Node, b: Node) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

export function SectionPicker(props: SectionPickerProps) {
  const { levels, classes, sections, branches, name, required, emptyLabel } = props;
  const [branchId, setBranchId] = useState(props.defaultBranchId ?? branches?.[0]?.id ?? '');
  // The chosen class at each level above sections ("" = not chosen yet); at first the path to
  // the default section, if any.
  const [chosen, setChosen] = useState<string[]>(() =>
    pathTo(props.defaultSectionId, classes, sections).slice(0, levels.length - 1),
  );
  const [sectionId, setSectionId] = useState(props.defaultSectionId ?? '');

  const branchSections = sections.filter(
    (s) => s.isActive && (!branches || s.branchId === branchId),
  );
  // A class is offered only if a section of this branch is somewhere under it.
  const reachable = useMemo(() => {
    const ids = new Set<string>();
    const byId = new Map(classes.map((c) => [c.id, c]));
    for (const s of branchSections) {
      let parentId = s.parentId;
      while (parentId) {
        ids.add(parentId);
        parentId = byId.get(parentId)?.parentId ?? null;
      }
    }
    return ids;
  }, [classes, branchSections]);

  const choose = (level: number, id: string) => {
    setChosen([...chosen.slice(0, level), id]);
    setSectionId('');
  };

  const sectionLevel = levels.length - 1; // index of the section level
  const lastChosen = chosen[sectionLevel - 1] ?? '';
  const sectionChoices = branchSections.filter((s) => s.parentId === lastChosen).sort(byOrder);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {branches && (
        <Field label="Branch" htmlFor="picker-branch">
          <Select
            id="picker-branch"
            name={props.branchName ?? 'branchId'}
            value={branchId}
            required
            onChange={(e) => {
              setBranchId(e.target.value);
              setChosen([]);
              setSectionId('');
            }}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {props.afterBranch}
      {levels.slice(0, sectionLevel).map((levelName, level) => {
        const parentId = level === 0 ? null : chosen[level - 1];
        if (level > 0 && !parentId) return null;
        const options = classes
          .filter((c) => c.parentId === parentId && c.isActive && reachable.has(c.id))
          .sort(byOrder);
        return (
          <Field key={levelName} label={levelName} htmlFor={`picker-${level}`}>
            <Select
              id={`picker-${level}`}
              value={chosen[level] ?? ''}
              onChange={(e) => choose(level, e.target.value)}
            >
              <option value="">
                {options.length ? `Choose…` : `No ${levelName.toLowerCase()} with sections`}
              </option>
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        );
      })}
      <Field label={levels[sectionLevel]} htmlFor="picker-section">
        <Select
          id="picker-section"
          name={name}
          value={sectionId}
          required={required}
          disabled={!lastChosen}
          onChange={(e) => setSectionId(e.target.value)}
        >
          <option value="">{emptyLabel ?? 'Choose…'}</option>
          {sectionChoices.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

/** The ids from the top down to a section's parent, to start with that section chosen. */
function pathTo(sectionId: string | undefined, classes: Node[], sections: SectionNode[]): string[] {
  const section = sections.find((s) => s.id === sectionId);
  if (!section) return [];
  const byId = new Map(classes.map((c) => [c.id, c]));
  const path: string[] = [];
  let parentId = section.parentId;
  while (parentId) {
    path.unshift(parentId);
    parentId = byId.get(parentId)?.parentId ?? null;
  }
  return path;
}
