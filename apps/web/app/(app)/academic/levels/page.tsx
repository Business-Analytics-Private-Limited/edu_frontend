/**
 * /academic/levels?institution=<id>: name the levels of an institution's classes, top to
 * bottom, one per line, e.g.
 *     Year / Group / Section              (a typical junior college)
 *     Type / Group / Stream / Section     (an institution that works with four levels)
 * The last level is where students are placed. While the institution has no classes you can
 * change the number of levels; after that you can only rename them.
 */
import { ActionForm, Card, CardContent, Field, PageHeader } from '@eduplatform/ui';
import { notFound } from 'next/navigation';
import { api } from '../../../../lib/api';
import { canAt, getMe } from '../../../../lib/me';
import type { ClassLevel, Institution } from '../../../../lib/types';
import { setLevels } from '../actions';

export default async function LevelsPage({
  searchParams,
}: {
  searchParams: Promise<{ institution?: string }>;
}) {
  const { institution: institutionId } = await searchParams;
  if (!institutionId) notFound();
  const [me, institutions, levels] = await Promise.all([
    getMe(),
    api<Institution[]>('/institutions'),
    api<ClassLevel[]>(`/institutions/${institutionId}/class-levels`),
  ]);
  const institution = institutions.find((i) => i.id === institutionId);
  if (!institution) notFound();
  const canEdit = canAt(me, 'academic.structure.update', { institutionId });

  return (
    <>
      <PageHeader
        title={`Class levels · ${institution.name}`}
        description="From the top level down to the level where students are placed (up to 6)."
      />
      <Card className="max-w-md">
        <CardContent className="pt-6">
          {canEdit ? (
            <ActionForm action={setLevels.bind(null, institutionId)} submitLabel="Save levels">
              <Field
                label="Levels, one per line"
                htmlFor="levels"
                hint="Renaming is always possible; adding or removing levels only before the first class is created."
              >
                <textarea
                  id="levels"
                  name="levels"
                  rows={6}
                  defaultValue={levels.map((l) => l.name).join('\n')}
                  className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm"
                />
              </Field>
            </ActionForm>
          ) : (
            <ol className="list-decimal pl-5 text-sm">
              {levels.map((l) => (
                <li key={l.id}>{l.name}</li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </>
  );
}
