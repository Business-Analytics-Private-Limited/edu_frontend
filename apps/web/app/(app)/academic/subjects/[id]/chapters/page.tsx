/**
 * /academic/subjects/:id/chapters: a subject's syllabus (backend ADR-0036), the chapters in
 * teaching order. A new exam ticks the chapters it covers per subject. A chapter an exam uses
 * can't be deleted, only marked "not in use" (then it is no longer offered for new exams).
 */
import {
  ActionForm,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  PageHeader,
  Table,
  TableHead,
  Td,
  Textarea,
  Th,
} from '@eduplatform/ui';
import { api } from '../../../../../../lib/api';
import { canAt, getMe } from '../../../../../../lib/me';
import type { SubjectChapters } from '../../../../../../lib/types';
import {
  addChapters,
  deleteChapter,
  moveChapter,
  renameChapter,
  setChapterInUse,
} from '../../../actions';

export default async function ChaptersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getMe();
  const { subject, chapters } = await api<SubjectChapters>(`/subjects/${id}/chapters`);
  const organization = {};
  const canChange = canAt(me, 'academic.subject.update', organization);
  const order = chapters.map((c) => c.id);

  return (
    <>
      <PageHeader
        back={{ href: '/academic/subjects', label: 'Back to subjects' }}
        title={`Syllabus: ${subject.name}`}
        description={`${subject.code} · the chapters in teaching order. A new exam ticks the chapters it covers.`}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <TableHead>
              <tr>
                <Th>#</Th>
                <Th>Chapter</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </TableHead>
            <tbody>
              {chapters.map((chapter, index) => (
                <tr key={chapter.id}>
                  <Td className="text-muted-foreground">{index + 1}</Td>
                  <Td>
                    {canChange ? (
                      <ActionForm
                        action={renameChapter.bind(null, id, chapter.id)}
                        submitLabel="Rename"
                        pendingLabel="…"
                        submitVariant="outline"
                        submitSize="sm"
                        className="flex flex-wrap items-center gap-2"
                      >
                        <Input
                          name="name"
                          required
                          maxLength={200}
                          defaultValue={chapter.name}
                          aria-label="Chapter name"
                          className="w-full sm:w-64"
                        />
                      </ActionForm>
                    ) : (
                      chapter.name
                    )}
                  </Td>
                  <Td>
                    <Badge variant={chapter.isActive ? 'success' : 'outline'}>
                      {chapter.isActive ? 'In use' : 'Not in use'}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    {canChange && (
                      <div className="flex flex-wrap justify-end gap-1">
                        {index > 0 && (
                          <ActionForm
                            action={moveChapter.bind(null, id, order, index, -1)}
                            submitLabel="↑"
                            pendingLabel="…"
                            submitVariant="outline"
                            submitSize="sm"
                          />
                        )}
                        {index < chapters.length - 1 && (
                          <ActionForm
                            action={moveChapter.bind(null, id, order, index, 1)}
                            submitLabel="↓"
                            pendingLabel="…"
                            submitVariant="outline"
                            submitSize="sm"
                          />
                        )}
                        <ActionForm
                          action={setChapterInUse.bind(null, id, chapter.id, !chapter.isActive)}
                          submitLabel={chapter.isActive ? 'Not in use' : 'Use again'}
                          pendingLabel="…"
                          submitVariant="outline"
                          submitSize="sm"
                        />
                        <ActionForm
                          action={deleteChapter.bind(null, id, chapter.id)}
                          submitLabel="Delete"
                          pendingLabel="…"
                          confirmMessage={`Delete the chapter "${chapter.name}"?`}
                          submitVariant="destructive"
                          submitSize="sm"
                        />
                      </div>
                    )}
                  </Td>
                </tr>
              ))}
              {chapters.length === 0 && (
                <tr>
                  <Td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No chapters yet.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {canChange && (
          <Card>
            <CardHeader>
              <CardTitle>Add chapters</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm
                action={addChapters.bind(null, id)}
                submitLabel="Add chapters"
                resetOnSuccess
              >
                <Field
                  label="Chapters"
                  htmlFor="chapterNames"
                  hint="One per line, in teaching order. They are added after the existing ones."
                >
                  <Textarea
                    id="chapterNames"
                    name="names"
                    rows={8}
                    required
                    placeholder={'Sets and functions\nTrigonometry\nComplex numbers'}
                  />
                </Field>
              </ActionForm>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
