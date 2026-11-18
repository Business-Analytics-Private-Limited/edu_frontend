/**
 * /academic/classes/:id/subjects: the subjects of one class.
 *   - inherited: attached to a class above this one (e.g. on "MPC" for "MPC -> Section A");
 *     change those on that class's page;
 *   - own: ticked here; the classes below this one will inherit them.
 * Changing them needs "academic.structure.update" where the class belongs: the whole
 * organization, or the branch of a section.
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
import { canAt, getMe } from '../../../../../../lib/me';
import type { ClassSubjects } from '../../../../../../lib/types';
import { setClassSubjects } from '../../../actions';

export default async function ClassSubjectsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, data] = await Promise.all([getMe(), api<ClassSubjects>(`/classes/${id}/subjects`)]);
  const place = { branchId: data.class.branchId };
  const canEdit = canAt(me, 'academic.structure.update', place);
  const own = new Set(data.own.map((s) => s.id));
  const inherited = new Set(data.inherited.map((i) => i.subject.id));
  const fullName = [...data.path.map((p) => p.name), data.class.name].join(' → ');

  return (
    <>
      <PageHeader
        back={
          data.class.branchId
            ? {
                href: `/academic/sections?branch=${data.class.branchId}`,
                label: 'Back to sections',
              }
            : { href: '/academic/structure', label: 'Back to the structure' }
        }
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
                    The organization has no subjects yet (Academic → Subjects).
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
