'use client';
/**
 * The import page's column guide (ADR-0031): short on the page, complete in a slide-in panel.
 *
 *   on the page:   the required columns as chips, how many are optional, "See all columns"
 *   in the panel:  every column in its group (Student, Contact, Parents …), with what to write
 *                  and an example, and a search box ("phone", "aadhaar" …)
 *
 *   <ImportColumnGuide groups={groupedColumns(importColumnsFor(org.admissionNumbering))} />
 */
import { Badge, Drawer, Input } from '@eduplatform/ui';
import { Columns3, Search } from 'lucide-react';
import { useState } from 'react';
import type { ImportColumn } from '../lib/import-columns';

export function ImportColumnGuide({
  groups,
}: {
  groups: { title: string; columns: ImportColumn[] }[];
}) {
  const [query, setQuery] = useState('');
  const all = groups.flatMap((g) => g.columns);
  const required = all.filter((c) => c.required);
  const q = query.trim().toLowerCase();
  const shown = groups
    .map((g) => ({
      ...g,
      columns: g.columns.filter(
        (c) => !q || c.name.toLowerCase().includes(q) || c.help.toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.columns.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Required ({required.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {required.map((c) => (
            <span
              key={c.name}
              title={c.help}
              className="rounded-full border border-primary/30 bg-accent px-2.5 py-1 font-mono text-xs text-accent-foreground"
            >
              {c.name}
            </span>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {all.length - required.length} more columns are optional: leave them empty, or take them out
        of the sheet.
      </p>
      <div>
        <Drawer
          title="Import columns"
          description={`${all.length} columns, in the template's order.`}
          trigger={
            <>
              <Columns3 /> See all {all.length} columns
            </>
          }
        >
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              placeholder="Find a column, e.g. phone or aadhaar"
              className="pl-9"
              aria-label="Find a column"
            />
          </div>
          <div className="flex flex-col gap-5">
            {shown.map((g) => (
              <section key={g.title}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {g.title}
                </h3>
                <ul className="divide-y rounded-xl border">
                  {g.columns.map((c) => (
                    <li key={c.name} className="flex flex-col gap-0.5 px-3 py-2.5">
                      <span className="flex flex-wrap items-center gap-2">
                        <code className="font-mono text-sm font-medium">{c.name}</code>
                        {c.required && <Badge variant="default">required</Badge>}
                      </span>
                      {c.help && <span className="text-sm text-muted-foreground">{c.help}</span>}
                      {c.example && (
                        <span className="text-xs text-muted-foreground">
                          e.g. <code className="font-mono">{c.example}</code>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {shown.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No column matches &quot;{query}&quot;.
              </p>
            )}
          </div>
        </Drawer>
      </div>
    </div>
  );
}
