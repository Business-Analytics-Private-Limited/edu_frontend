/**
 * /academic/sections?branch=: the SECTIONS of a branch (ADR-0030), where students are placed.
 * A section sits under a class of the level just above it (a stream, a class, a year of a
 * course), e.g. "Junior › MPC › JEE Mains" > JEE-A. Each branch builds its own sections;
 * a Branch admin does it for their branch ("academic.structure.*" at the branch).
 */
import {
  ActionForm,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { Layers } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { branchesWith, canAt, getMe } from '../../../../lib/me';
import { branchName } from '../../../../lib/places';
import type { Branch, BranchSections, ClassItem, Structure } from '../../../../lib/types';
import { createSection, deleteClass, setClassInUse } from '../actions';

export default async function SectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const params = await searchParams;
  const me = await getMe();
  const [allBranches, structure] = await Promise.all([
    api<Branch[]>('/branches'),
    api<Structure>('/academic-structure'),
  ]);
  const visible = branchesWith(me, 'academic.structure.view');
  const branches = allBranches.filter((b) => visible === 'all' || visible.includes(b.id));
  const branch = branches.find((b) => b.id === params.branch) ?? branches[0];
  if (!branch) {
    return (
      <>
        <PageHeader title="Sections" />
        <EmptyState
          icon={<Layers />}
          title="No branch"
          description="You have no branch to work on."
        />
      </>
    );
  }
  const { sections } = await api<BranchSections>(`/branches/${branch.id}/sections`);
  const here = { branchId: branch.id };
  const may = {
    create: branch.status === 'ACTIVE' && canAt(me, 'academic.structure.create', here),
    update: canAt(me, 'academic.structure.update', here),
    delete: canAt(me, 'academic.structure.delete', here),
  };
  const sectionLevelName = structure.levels[structure.sectionLevel - 1];

  // Where a section can go: the classes just above the section level, as "A › B › C".
  const byId = new Map(structure.classes.map((c) => [c.id, c]));
  const label = (c: ClassItem): string => {
    const parent = c.parentId ? byId.get(c.parentId) : undefined;
    return parent ? `${label(parent)} › ${c.name}` : c.name;
  };
  const parents = structure.classes
    .filter((c) => c.level === structure.sectionLevel - 1 && c.isActive)
    .map((c) => ({ id: c.id, label: label(c) }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const path = `/academic/sections?branch=${branch.id}`;

  return (
    <>
      <PageHeader
        title="Sections"
        description={`${sectionLevelName}s of each branch, under ${structure.levels
          .slice(0, -1)
          .join(' › ')}.`}
      />
      <form className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Branch" htmlFor="branch">
          <Select id="branch" name="branch" defaultValue={branch.id} className="w-full sm:w-56">
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {branchName(b)}
              </option>
            ))}
          </Select>
        </Field>
        <button type="submit" className="h-9 rounded-md border px-3 text-sm">
          Show
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <TableHead>
              <tr>
                <Th>Under</Th>
                <Th>{sectionLevelName}</Th>
                <Th>Code</Th>
                <Th />
              </tr>
            </TableHead>
            <tbody>
              {sections.map((s) => (
                <tr key={s.id}>
                  <Td className="text-muted-foreground">{s.path}</Td>
                  <Td className="font-medium">
                    {s.name}
                    {!s.isActive && (
                      <Badge variant="outline" className="ml-2">
                        Not in use
                      </Badge>
                    )}
                  </Td>
                  <Td>{s.code}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/academic/classes/${s.id}/subjects`}
                        className="self-center px-2 text-xs text-primary hover:underline"
                      >
                        Subjects
                      </Link>
                      {may.update && (
                        <ActionForm
                          action={setClassInUse.bind(null, s.id, path, !s.isActive)}
                          submitLabel={s.isActive ? 'Switch off' : 'Switch on'}
                          pendingLabel="…"
                          submitVariant="ghost"
                          submitSize="sm"
                        />
                      )}
                      {may.delete && (
                        <ActionForm
                          action={deleteClass.bind(null, s.id, path)}
                          submitLabel="Delete"
                          pendingLabel="…"
                          confirmMessage={`Delete ${s.name}? Only possible if no student was ever placed in it.`}
                          submitVariant="destructive"
                          submitSize="sm"
                        />
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
              {sections.length === 0 && (
                <tr>
                  <Td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No {sectionLevelName.toLowerCase()}s at {branch.name} yet.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {may.create && (
          <Card>
            <CardHeader>
              <CardTitle>Add {sectionLevelName.toLowerCase()}</CardTitle>
            </CardHeader>
            <CardContent>
              {parents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Set up the{' '}
                  <Link href="/academic/structure" className="text-primary hover:underline">
                    academic structure
                  </Link>{' '}
                  first.
                </p>
              ) : (
                <ActionForm
                  action={createSection.bind(null, branch.id)}
                  submitLabel={`Add ${sectionLevelName.toLowerCase()}`}
                  resetOnSuccess
                >
                  <Field label="Under" htmlFor="parentId">
                    <Select id="parentId" name="parentId" required>
                      {parents.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Name" htmlFor="name">
                    <Input id="name" name="name" required placeholder="JEE-A" />
                  </Field>
                  <Field
                    label="Code"
                    htmlFor="code"
                    hint="Same code next year (e.g. A) = promotion finds it by itself"
                  >
                    <Input id="code" name="code" required placeholder="A" maxLength={20} />
                  </Field>
                </ActionForm>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
