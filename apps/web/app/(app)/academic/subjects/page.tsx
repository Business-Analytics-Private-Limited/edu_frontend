/**
 * /academic/subjects: the organization's subject list (Mathematics, Physics, ...).
 * Which class has which subject is set on a class's page (Classes -> Subjects).
 * Managing the list needs "academic.subject.*" for the whole organization; a subject that classes use
 * can't be deleted, but can be marked "not in use".
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
  Th,
} from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import { canAt, getMe } from '../../../../lib/me';
import type { SubjectListItem } from '../../../../lib/types';
import { createSubject, deleteSubject, setSubjectInUse } from '../actions';

export default async function SubjectsPage() {
  const me = await getMe();
  const subjects = await api<SubjectListItem[]>('/subjects');
  const organization = {};
  const canCreate = canAt(me, 'academic.subject.create', organization);

  return (
    <>
      <PageHeader
        title="Subjects"
        description="Attach subjects to classes on a class's Subjects page; the classes below inherit them."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <TableHead>
              <tr>
                <Th>Subject</Th>
                <Th>Used by</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </TableHead>
            <tbody>
              {subjects.map((subject) => {
                const here = organization;
                return (
                  <tr key={subject.id}>
                    <Td>
                      <span className="font-medium">{subject.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{subject.code}</span>
                    </Td>
                    <Td>{subject._count.classes} class(es)</Td>
                    <Td>
                      <Badge variant={subject.isActive ? 'success' : 'outline'}>
                        {subject.isActive ? 'In use' : 'Not in use'}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        {canAt(me, 'academic.subject.update', here) && (
                          <ActionForm
                            action={setSubjectInUse.bind(null, subject.id, !subject.isActive)}
                            submitLabel={subject.isActive ? 'Mark not in use' : 'Use again'}
                            pendingLabel="…"
                            submitVariant="outline"
                            submitSize="sm"
                          />
                        )}
                        {canAt(me, 'academic.subject.delete', here) &&
                          subject._count.classes === 0 && (
                            <ActionForm
                              action={deleteSubject.bind(null, subject.id)}
                              submitLabel="Delete"
                              pendingLabel="…"
                              confirmMessage={`Delete ${subject.name}?`}
                              submitVariant="destructive"
                              submitSize="sm"
                            />
                          )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
              {subjects.length === 0 && (
                <tr>
                  <Td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No subjects yet.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {canCreate && (
          <Card>
            <CardHeader>
              <CardTitle>Add subject</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm action={createSubject} submitLabel="Add subject" resetOnSuccess>
                <Field label="Name" htmlFor="subjectName">
                  <Input id="subjectName" name="name" required placeholder="Mathematics" />
                </Field>
                <Field label="Code" htmlFor="subjectCode" hint="Unique in the organization">
                  <Input
                    id="subjectCode"
                    name="code"
                    required
                    placeholder="MATHS"
                    pattern="[A-Za-z0-9_\-]{1,20}"
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
