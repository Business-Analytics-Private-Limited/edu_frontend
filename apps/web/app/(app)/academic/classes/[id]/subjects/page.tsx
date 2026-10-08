/**
 * /academic/classes/:id/subjects: the subjects of one class.
 *   - inherited: attached to a class above this one (e.g. on "MPC" for "MPC -> Section A");
 *     change those on that class's page;
 *   - own: ticked here; the classes below this one will inherit them.
 * Changing them needs "academic.structure.update" at the class's campus.
 */
import {
  ActionForm,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  PageHeader,
} from '@eduplatform/ui';
import { api } from '../../../../../../lib/api';
import { can, canAt, getMe } from '../../../../../../lib/me';
import type { ClassSubjects, Institution } from '../../../../../../lib/types';
import { setClassSubjects } from '../../../actions';

export default async function ClassSubjectsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getMe();
  const [data, institutions] = await Promise.all([
    api<ClassSubjects>(`/classes/${id}/subjects`),
    can(me, 'platform.institution.view') ? api<Institution[]>('/institutions') : [],
  ]);
  const institution = institutions.find((i) =>
    i.campuses.some((c) => c.id === data.class.campusId),
  );
  const place = { institutionId: institution?.id ?? null, campusId: data.class.campusId };
  const canEdit = canAt(me, 'academic.structure.update', place);
  const own = new Set(data.own.map((s) => s.id));
  const inherited = new Set(data.inherited.map((i) => i.subject.id));
  const fullName = [...data.path.map((p) => p.name), data.class.name].join(' → ');

  return (
    <>
      <PageHeader
        back={{ href: `/academic/classes?campus=${data.class.campusId}`, label: 'Back to classes' }}
        title={`Subjects · ${data.class.name}`}
        description={fullName}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inherited</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {data.inherited.length === 0 && (
              <p className="text-muted-foreground">Nothing from the classes above.</p>
            )}
            {data.inherited.map((i) => (
              <div key={i.subject.id} className="flex items-center gap-2">
                <Badge>{i.subject.name}</Badge>
                <span className="text-muted-foreground">from {i.from.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This class's own subjects</CardTitle>
          </CardHeader>
          <CardContent>
            {canEdit ? (
              <ActionForm action={setClassSubjects.bind(null, id)} submitLabel="Save subjects">
                {data.available.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    The institution has no subjects yet (Academic → Subjects).
                  </p>
                )}
                {data.available
                  .filter((s) => !inherited.has(s.id))
                  .map((s) => (
                    <Checkbox
                      key={s.id}
                      name="subjectIds"
                      value={s.id}
                      label={s.name}
                      description={s.code}
                      defaultChecked={own.has(s.id)}
                    />
                  ))}
              </ActionForm>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.own.length === 0 && (
                  <p className="text-sm text-muted-foreground">None of its own.</p>
                )}
                {data.own.map((s) => (
                  <Badge key={s.id}>{s.name}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
