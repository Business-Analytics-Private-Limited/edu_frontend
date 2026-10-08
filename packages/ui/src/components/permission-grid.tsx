/**
 * The permission grid on the role screens: one row per resource (Institutions, Students, ...),
 * one checkbox per action (View, Create, Edit, Delete, and special ones like Mark or Import).
 *
 * Every ticked box is sent with the form as name="permissions", value="<resource>.<action>",
 * so the server action reads them with form.getAll('permissions').
 *
 *   <PermissionGrid resources={resources} checked={role.permissions} />
 *   <PermissionGrid resources={resources} checked={role.permissions} readOnly />
 *   <PermissionGrid resources={resources} checked={[]} allowed={me.permissions} />
 */
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface PermissionResource {
  /** module.resource, e.g. "platform.institution". */
  key: string;
  group: string;
  label: string;
  actions: string[];
  /** false when the organization doesn't have the module (the boxes are shown but locked). */
  available?: boolean;
}

export interface PermissionGridProps {
  resources: PermissionResource[];
  /** Permission keys that start ticked. */
  checked: string[];
  /** Only show, don't allow changes (predefined roles in an organization). */
  readOnly?: boolean;
  /** If given, only these permissions can be ticked (you can't give what you don't have). */
  allowed?: string[];
}

const MAIN_ACTIONS = [
  { action: 'view', label: 'View' },
  { action: 'create', label: 'Create' },
  { action: 'update', label: 'Edit' },
  { action: 'delete', label: 'Delete' },
];
const MAIN_KEYS = MAIN_ACTIONS.map((a) => a.action);

export function PermissionGrid({ resources, checked, readOnly, allowed }: PermissionGridProps) {
  // { "Organization": [...], "Students": [...] } in the order of the list.
  const groups = new Map<string, PermissionResource[]>();
  for (const resource of resources) {
    groups.set(resource.group, [...(groups.get(resource.group) ?? []), resource]);
  }

  function box(resource: PermissionResource, action: string, label?: string) {
    const key = `${resource.key}.${action}`;
    const locked =
      readOnly || resource.available === false || (allowed !== undefined && !allowed.includes(key));
    return (
      <label
        key={key}
        className={cn('inline-flex items-center gap-1.5 text-xs', locked && 'opacity-60')}
        title={key}
      >
        <input
          type="checkbox"
          name="permissions"
          value={key}
          defaultChecked={checked.includes(key)}
          disabled={locked}
          className="size-4 accent-[var(--primary)]"
          aria-label={`${resource.label}: ${label ?? action}`}
        />
        {/* A disabled box isn't sent with the form: keep a ticked, locked permission (module
            off, or one you can't hand out) so saving doesn't silently remove it. */}
        {locked && !readOnly && checked.includes(key) && (
          <input type="hidden" name="permissions" value={key} />
        )}
        {label}
      </label>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">What</th>
            {MAIN_ACTIONS.map((a) => (
              <th key={a.action} className="w-16 px-2 py-2 text-center font-medium">
                {a.label}
              </th>
            ))}
            <th className="px-3 py-2 font-medium">Other</th>
          </tr>
        </thead>
        <tbody>
          {[...groups].map(([group, items]) => (
            <GroupRows key={group} group={group}>
              {items.map((resource) => (
                <tr key={resource.key} className="border-t">
                  <td className="px-3 py-2">
                    {resource.label}
                    {resource.available === false && (
                      <span className="ml-2 text-xs text-muted-foreground">(module off)</span>
                    )}
                  </td>
                  {MAIN_KEYS.map((action) => (
                    <td key={action} className="px-2 py-2 text-center">
                      {resource.actions.includes(action) ? box(resource, action) : null}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-3">
                      {resource.actions
                        .filter((action) => !MAIN_KEYS.includes(action))
                        .map((action) => box(resource, action, capitalize(action)))}
                    </div>
                  </td>
                </tr>
              ))}
            </GroupRows>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupRows({ group, children }: { group: string; children: ReactNode }) {
  return (
    <>
      <tr className="border-t bg-muted/30">
        <td colSpan={6} className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide">
          {group}
        </td>
      </tr>
      {children}
    </>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
