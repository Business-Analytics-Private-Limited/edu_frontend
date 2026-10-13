/**
 * /academic/structure: the organization's academic structure above sections (ADR-0030), built
 * the way its type needs:
 *   School         tick the classes it runs (Nursery ... Class 10)
 *   Intermediate   switch groups on (MPC, BiPC, CEC, HEC; each gets "Regular (IPE)"), choose
 *                  which groups each BRANCH runs (ADR-0032; a Branch admin for their branch), add
 *                  the college's own streams (JEE Mains, NEET ...; long-term ones under Long Term)
 *   Degree / Eng.  add courses (B.Tech) and specializations (CSE) with their number of years
 * Also: the level names (renameable), where students go after each year (promotion), and the
 * whole tree with each class's subjects. Sections are added per branch on /academic/sections.
 *
 * Changing the structure needs "academic.structure.*" for the whole organization; everyone with
 * "academic.structure.view" sees it.
 */
import {
  ActionForm,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  Input,
  PageHeader,
  Select,
} from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { ORGANIZATION_TYPES } from '../../../../lib/labels';
import { can, canAt, getMe } from '../../../../lib/me';
import type { Branch, ClassItem, Me, Structure } from '../../../../lib/types';
import {
  addCourse,
  addSpecialization,
  addStream,
  deleteClass,
  deleteStream,
  setBranchGroups,
  setGroups,
  setLevelNames,
  setNext,
  setSchoolClasses,
} from '../actions';

const PATH = '/academic/structure';
const byOrder = (a: ClassItem, b: ClassItem) =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

export default async function StructurePage() {
  const [me, structure] = await Promise.all([getMe(), api<Structure>('/academic-structure')]);
  const branches =
    structure.type === 'INTERMEDIATE' && can(me, 'platform.branch.view')
      ? await api<Branch[]>('/branches')
      : [];
  const whole = {};
  const may = {
    create: canAt(me, 'academic.structure.create', whole),
    update: canAt(me, 'academic.structure.update', whole),
    delete: canAt(me, 'academic.structure.delete', whole),
  };
  const { classes, levels } = structure;
  const childrenOf = (id: string | null) => classes.filter((c) => c.parentId === id).sort(byOrder);
  const label = (c: ClassItem): string => {
    const parent = c.parentId ? classes.find((p) => p.id === c.parentId) : undefined;
    return parent ? `${label(parent)} › ${c.name}` : c.name;
  };
  const years = classes.filter((c) => c.level === structure.yearLevel);

  return (
    <>
      <PageHeader
        title="Academic structure"
        description={`${ORGANIZATION_TYPES[structure.type]}: ${levels.join(' › ')}. Sections are added per branch.`}
        actions={
          <Link href="/academic/sections" className="text-sm text-primary hover:underline">
            Sections of each branch →
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {structure.type === 'SCHOOL' && (
          <SchoolClasses structure={structure} canEdit={may.update} />
        )}
        {structure.type === 'INTERMEDIATE' && (
          <IntermediateSetup structure={structure} may={may} branches={branches} me={me} />
        )}
        {(structure.type === 'DEGREE' || structure.type === 'ENGINEERING') && (
          <Courses structure={structure} may={may} childrenOf={childrenOf} />
        )}

        <Card>
          <CardHeader>
            <CardTitle>After each year</CardTitle>
            <CardDescription>
              Where promotion moves students. Empty = they complete (Class 10, Senior, the final
              year).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {years.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing set up yet.</p>
            )}
            {years.map((year) => (
              <div key={year.id} className="flex flex-wrap items-end gap-2">
                <span className="sm:min-w-48 text-sm font-medium">{label(year)}</span>
                {may.update && !year.longTerm ? (
                  <ActionForm
                    action={setNext.bind(null, year.id)}
                    submitLabel="Save"
                    submitSize="sm"
                    submitVariant="outline"
                    className="flex-row items-end gap-2"
                  >
                    <Select
                      name="nextClassId"
                      defaultValue={year.nextClassId ?? ''}
                      aria-label={`After ${year.name}`}
                      className="w-full sm:w-56"
                    >
                      <option value="">Completes</option>
                      {years
                        .filter((y) => y.id !== year.id && !y.longTerm)
                        .map((y) => (
                          <option key={y.id} value={y.id}>
                            {label(y)}
                          </option>
                        ))}
                    </Select>
                  </ActionForm>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    →{' '}
                    {year.nextClassId
                      ? label(classes.find((c) => c.id === year.nextClassId)!)
                      : 'completes'}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {may.update && (
          <Card>
            <CardHeader>
              <CardTitle>Level names</CardTitle>
              <CardDescription>
                Rename them to your own words (the number is fixed).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActionForm action={setLevelNames.bind(null, levels.length)} submitLabel="Save names">
                <div className="grid gap-3 sm:grid-cols-2">
                  {levels.map((name, i) => (
                    <Field key={i} label={`Level ${i + 1}`} htmlFor={`level${i}`}>
                      <Input id={`level${i}`} name={`level${i}`} defaultValue={name} required />
                    </Field>
                  ))}
                </div>
              </ActionForm>
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>The whole structure</CardTitle>
            <CardDescription>
              Subjects set on a class apply to everything under it, in every branch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing set up yet.</p>
            ) : (
              <Tree
                nodes={childrenOf(null)}
                childrenOf={childrenOf}
                me={me}
                canDelete={may.delete}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function SchoolClasses({ structure, canEdit }: { structure: Structure; canEdit: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Classes</CardTitle>
        <CardDescription>Tick the classes your school runs.</CardDescription>
      </CardHeader>
      <CardContent>
        <ActionForm action={setSchoolClasses} submitLabel="Save classes">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {structure.builtIn.map((c) => (
              <Checkbox
                key={c.code}
                name="codes"
                value={c.code}
                label={c.name}
                defaultChecked={c.enabled}
                disabled={!canEdit}
              />
            ))}
          </div>
        </ActionForm>
      </CardContent>
    </Card>
  );
}

function IntermediateSetup({
  structure,
  may,
  branches,
  me,
}: {
  structure: Structure;
  may: { create: boolean; update: boolean; delete: boolean };
  branches: Branch[];
  me: Me;
}) {
  const enabledGroups = structure.builtIn.filter((g) => g.enabled);
  // Streams by group: one row per stream code (it appears under Junior and Senior, or Long Term).
  const streams = structure.classes.filter((c) => c.level === 3 && !c.builtIn);
  const groupOf = (stream: ClassItem) =>
    structure.classes.find((c) => c.id === stream.parentId)?.code ?? '';
  const unique = [...new Map(streams.map((s) => [`${groupOf(s)}/${s.code}`, s])).values()].sort(
    (a, b) => groupOf(a).localeCompare(groupOf(b)) || a.name.localeCompare(b.name),
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Groups</CardTitle>
          <CardDescription>
            Switch on the groups your college runs. Each gets the stream &quot;Regular (IPE)&quot;.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={setGroups} submitLabel="Save groups">
            <div className="flex flex-wrap gap-4">
              {structure.builtIn.map((g) => (
                <Checkbox
                  key={g.code}
                  name="codes"
                  value={g.code}
                  label={g.name}
                  defaultChecked={g.enabled}
                  disabled={!may.update}
                />
              ))}
            </div>
          </ActionForm>
        </CardContent>
      </Card>

      {enabledGroups.length > 0 && branches.length > 0 && (
        <BranchGroups structure={structure} branches={branches} me={me} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Streams</CardTitle>
          <CardDescription>
            Your own streams in a group, e.g. IIT, JEE Mains in MPC; NEET in BiPC. Sections are
            created inside a stream.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2 text-sm">
            {unique.length === 0 && <li className="text-muted-foreground">No own streams yet.</li>}
            {unique.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2">
                <span>
                  <Badge variant="outline" className="mr-2">
                    {groupOf(s)}
                  </Badge>
                  {s.name}
                  {s.longTerm && (
                    <Badge variant="warning" className="ml-2">
                      Long Term
                    </Badge>
                  )}
                </span>
                {may.delete && (
                  <ActionForm
                    action={deleteStream.bind(null, groupOf(s), s.code)}
                    submitLabel="Delete"
                    pendingLabel="…"
                    confirmMessage={`Delete the stream ${s.name}? Only possible when it has no sections.`}
                    submitVariant="destructive"
                    submitSize="sm"
                  />
                )}
              </li>
            ))}
          </ul>
          {may.create && enabledGroups.length > 0 && (
            <ActionForm action={addStream} submitLabel="Add stream" resetOnSuccess>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Group" htmlFor="groupCode">
                  <Select id="groupCode" name="groupCode" required>
                    {enabledGroups.map((g) => (
                      <option key={g.code} value={g.code}>
                        {g.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Name" htmlFor="streamName">
                  <Input id="streamName" name="name" required placeholder="JEE Mains" />
                </Field>
                <Field label="Code" htmlFor="streamCode">
                  <Input id="streamCode" name="code" required placeholder="JEEM" maxLength={20} />
                </Field>
              </div>
              <Checkbox
                name="longTerm"
                label="Long term"
                description="For students who already finished Intermediate (e.g. NEET Long Term): one year, no promotion."
              />
            </ActionForm>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function Courses({
  structure,
  may,
  childrenOf,
}: {
  structure: Structure;
  may: { create: boolean };
  childrenOf: (id: string | null) => ClassItem[];
}) {
  const courses = childrenOf(null);
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Courses and specializations</CardTitle>
        <CardDescription>
          e.g. B.Tech › Computer Science › 1st Year … 4th Year. A course without specializations
          (B.Com) gets one called &quot;General&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {courses.map((course) => (
          <div key={course.id} className="rounded-md border p-4">
            <p className="font-medium">{course.name}</p>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {childrenOf(course.id).map((spec) => (
                <li key={spec.id}>
                  {spec.name}{' '}
                  <span className="text-muted-foreground">
                    ({childrenOf(spec.id).length} years)
                  </span>
                </li>
              ))}
            </ul>
            {may.create && (
              <ActionForm
                action={addSpecialization.bind(null, course.id)}
                submitLabel="Add specialization"
                resetOnSuccess
                className="mt-3"
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Specialization" htmlFor={`spec-${course.id}`}>
                    <Input id={`spec-${course.id}`} name="name" required placeholder="CSE" />
                  </Field>
                  <Field label="Code" htmlFor={`spec-code-${course.id}`}>
                    <Input id={`spec-code-${course.id}`} name="code" required maxLength={20} />
                  </Field>
                  <Field label="Years" htmlFor={`spec-years-${course.id}`}>
                    <Select
                      id={`spec-years-${course.id}`}
                      name="years"
                      defaultValue={structure.type === 'ENGINEERING' ? '4' : '3'}
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </ActionForm>
            )}
          </div>
        ))}
        {may.create && (
          <ActionForm action={addCourse} submitLabel="Add course" resetOnSuccess>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Course" htmlFor="courseName">
                <Input id="courseName" name="name" required placeholder="B.Tech" />
              </Field>
              <Field label="Code" htmlFor="courseCode">
                <Input id="courseCode" name="code" required placeholder="BTECH" maxLength={20} />
              </Field>
            </div>
          </ActionForm>
        )}
      </CardContent>
    </Card>
  );
}

/** The structure as an indented list, each class with a link to its subjects. */
function Tree({
  nodes,
  childrenOf,
  me,
  canDelete,
}: {
  nodes: ClassItem[];
  childrenOf: (id: string | null) => ClassItem[];
  me: Me;
  canDelete: boolean;
}) {
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {nodes.map((node) => (
        <li key={node.id}>
          <div className="flex items-center gap-2 py-0.5">
            <span className={node.isActive ? '' : 'text-muted-foreground line-through'}>
              {node.name}
            </span>
            {node.longTerm && node.level === 1 && <Badge variant="warning">Long Term</Badge>}
            {me.permissions.includes('academic.subject.view') && (
              <Link
                href={`/academic/classes/${node.id}/subjects`}
                className="text-xs text-primary hover:underline"
              >
                Subjects
              </Link>
            )}
            {canDelete && !node.builtIn && childrenOf(node.id).length === 0 && (
              <ActionForm
                action={deleteClass.bind(null, node.id, PATH)}
                submitLabel="Delete"
                pendingLabel="…"
                confirmMessage={`Delete ${node.name}?`}
                submitVariant="ghost"
                submitSize="sm"
              />
            )}
          </div>
          {childrenOf(node.id).length > 0 && (
            <div className="ml-5 border-l pl-3">
              <Tree
                nodes={childrenOf(node.id)}
                childrenOf={childrenOf}
                me={me}
                canDelete={canDelete}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Which of the organization's groups each branch runs (ADR-0032): a row per branch, a column
 * per group. Sections at a branch can only be made under the groups ticked for it. Rows of
 * branches the user may not change (or that are closed) are read-only.
 */
function BranchGroups({
  structure,
  branches,
  me,
}: {
  structure: Structure;
  branches: Branch[];
  me: Me;
}) {
  const groups = structure.builtIn.filter((g) => g.enabled);
  const editable = (b: Branch) =>
    b.status === 'ACTIVE' && canAt(me, 'academic.structure.update', { branchId: b.id });
  const anyEditable = branches.some(editable);
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Groups at each branch</CardTitle>
        <CardDescription>
          Tick the groups each branch runs. A branch&apos;s sections, admissions and imports only
          offer its own groups. A group can&apos;t be unticked while the branch has sections under
          it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ActionForm action={setBranchGroups} submitLabel="Save groups at branches">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/60">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground sm:px-4">
                    Branch
                  </th>
                  {groups.map((g) => (
                    <th
                      key={g.code}
                      className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground"
                    >
                      {g.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => {
                  const runs = structure.branchGroups[b.id] ?? [];
                  const canEdit = editable(b);
                  return (
                    <tr key={b.id} className="border-b last:border-0">
                      <td className="px-3 py-2.5 font-medium sm:px-4">
                        {b.name}
                        {b.status !== 'ACTIVE' && (
                          <Badge variant="outline" className="ml-2">
                            Closed
                          </Badge>
                        )}
                        {canEdit && (
                          <>
                            <input type="hidden" name="branch" value={b.id} />
                            <input type="hidden" name={`name-${b.id}`} value={b.name} />
                            <input
                              type="hidden"
                              name={`was-${b.id}`}
                              value={[...runs].sort().join(',')}
                            />
                          </>
                        )}
                      </td>
                      {groups.map((g) => (
                        <td key={g.code} className="px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            name={`g-${b.id}`}
                            value={g.code}
                            defaultChecked={runs.includes(g.code)}
                            disabled={!canEdit}
                            aria-label={`${b.name}: ${g.name}`}
                            className="size-4 accent-[var(--primary)]"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!anyEditable && (
            <p className="text-xs text-muted-foreground">
              Your roles don&apos;t allow changing the groups of these branches.
            </p>
          )}
        </ActionForm>
      </CardContent>
    </Card>
  );
}
