/**
 * /academic/classes?campus=<id>: a campus's classes as a tree that follows the institution's
 * levels, e.g.
 *     1st year  (Year)
 *       MPC  (Group)
 *         Section A  (Section)   <- the last level: students will be placed here
 *
 * Pick a campus at the top (only campuses you may see). Each class has "Add <next level>" and
 * "Delete" when your roles allow it at this campus. Levels are named per institution on
 * /academic/levels.
 */
import {
  ActionForm,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  PageHeader,
} from '@eduplatform/ui';
import { Network } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { can, canAt, getMe } from '../../../../lib/me';
import type { CampusClasses, ClassItem, Institution, Me } from '../../../../lib/types';
import { createClass, deleteClass } from '../actions';
import { placeName } from '../../../../lib/places';

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ campus?: string }>;
}) {
  const me = await getMe();
  const institutions = can(me, 'platform.institution.view')
    ? await api<Institution[]>('/institutions')
    : [];
  // Every campus whose classes the user may see.
  const campuses = institutions.flatMap((i) =>
    i.campuses
      .filter((c) => canAt(me, 'academic.structure.view', { institutionId: i.id, campusId: c.id }))
      .map((c) => ({ ...c, institution: i })),
  );

  const { campus: chosen } = await searchParams;
  const campus = campuses.find((c) => c.id === chosen) ?? campuses[0];
  if (!campus) {
    return (
      <>
        <PageHeader title="Classes" />
        <EmptyState
          icon={<Network />}
          title="No campuses yet"
          description="Add an institution and a campus first."
        />
      </>
    );
  }

  const data = await api<CampusClasses>(`/campuses/${campus.id}/classes`);
  const place = { institutionId: campus.institution.id, campusId: campus.id };

  return (
    <>
      <PageHeader
        title="Classes"
        description={`${campus.name} · ${campus.institution.name}`}
        actions={
          canAt(me, 'academic.structure.update', { institutionId: campus.institution.id }) && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/academic/levels?institution=${campus.institution.id}`}>
                Edit levels
              </Link>
            </Button>
          )
        }
      />

      {campuses.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {campuses.map((c) => (
            <Button
              key={c.id}
              asChild
              size="sm"
              variant={c.id === campus.id ? 'default' : 'outline'}
            >
              <Link href={`/academic/classes?campus=${c.id}`}>
                {placeName(c, c.institution)} ({c.institution.code})
              </Link>
            </Button>
          ))}
        </div>
      )}

      <p className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        Levels:
        {data.levels.map((level, index) => (
          <span key={level.id} className="flex items-center gap-1">
            <Badge variant="outline">{level.name}</Badge>
            {index < data.levels.length - 1 && '→'}
          </span>
        ))}
      </p>

      <Card>
        <CardContent className="pt-6">
          {data.classes.length === 0 && (
            <p className="mb-4 text-sm text-muted-foreground">No classes on this campus yet.</p>
          )}
          <ClassTree data={data} parentId={null} me={me} place={place} />
          {canAt(me, 'academic.structure.create', place) && data.levels[0] && (
            <AddClassForm campusId={campus.id} parentId={null} levelName={data.levels[0].name} />
          )}
        </CardContent>
      </Card>
    </>
  );
}

/** The classes under `parentId`, each with its own children, indented. */
function ClassTree({
  data,
  parentId,
  me,
  place,
}: {
  data: CampusClasses;
  parentId: string | null;
  me: Me;
  place: { institutionId: string; campusId: string };
}) {
  const children = data.classes.filter((c) => c.parentId === parentId);
  if (children.length === 0) return null;
  return (
    <ul className={parentId ? 'ml-6 border-l pl-4' : ''}>
      {children.map((item) => (
        <ClassRow key={item.id} item={item} data={data} me={me} place={place} />
      ))}
    </ul>
  );
}

function ClassRow({
  item,
  data,
  me,
  place,
}: {
  item: ClassItem;
  data: CampusClasses;
  me: Me;
  place: { institutionId: string; campusId: string };
}) {
  const levelName = data.levels.find((l) => l.position === item.level)?.name ?? '';
  const nextLevel = data.levels.find((l) => l.position === item.level + 1);
  const isLast = !nextLevel;
  const hasChildren = data.classes.some((c) => c.parentId === item.id);

  return (
    <li className="py-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{item.name}</span>
        <span className="text-xs text-muted-foreground">
          {item.code} · {levelName}
        </span>
        <Link
          href={`/academic/classes/${item.id}/subjects`}
          className="text-xs text-primary hover:underline"
        >
          Subjects
        </Link>
        {isLast && <Badge variant="outline">students go here</Badge>}
        {!item.isActive && <Badge variant="warning">not in use</Badge>}
        {!hasChildren && canAt(me, 'academic.structure.delete', place) && (
          <ActionForm
            action={deleteClass.bind(null, item.id)}
            submitLabel="Delete"
            pendingLabel="…"
            confirmMessage={`Delete ${item.name}?`}
            submitVariant="ghost"
            submitSize="sm"
          />
        )}
      </div>
      <ClassTree data={data} parentId={item.id} me={me} place={place} />
      {nextLevel && canAt(me, 'academic.structure.create', place) && (
        <div className="ml-6 pl-4">
          <AddClassForm campusId={place.campusId} parentId={item.id} levelName={nextLevel.name} />
        </div>
      )}
    </li>
  );
}

/** "Add <level>" folded away until clicked, so the tree stays readable. */
function AddClassForm({
  campusId,
  parentId,
  levelName,
}: {
  campusId: string;
  parentId: string | null;
  levelName: string;
}) {
  return (
    <details className="py-1 text-sm">
      <summary className="cursor-pointer text-primary">+ Add {levelName.toLowerCase()}</summary>
      <ActionForm
        action={createClass.bind(null, campusId, parentId)}
        submitLabel={`Add ${levelName.toLowerCase()}`}
        submitSize="sm"
        resetOnSuccess
        className="mt-2 max-w-md flex-row flex-wrap items-center gap-2"
      >
        <Input name="name" required placeholder={`${levelName} name`} className="w-48" />
        <Input
          name="code"
          required
          placeholder="Code"
          className="w-24"
          pattern="[A-Za-z0-9_\-]{1,20}"
        />
      </ActionForm>
    </details>
  );
}
