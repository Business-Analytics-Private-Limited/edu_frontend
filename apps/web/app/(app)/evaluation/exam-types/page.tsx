/**
 * /evaluation/exam-types: the organization's kinds of exam, e.g. Weekly test (WT), Quarterly
 * (Q), Half-yearly (HY), Grand test (GT). Name and code are unique. A type used by exams can't be
 * deleted; switch it off instead, so it is no longer offered for new exams.
 * Needs "evaluation.settings.update" for the whole organization.
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
import type { ExamType } from '../../../../lib/types';
import { createExamType, deleteExamType, setExamTypeActive } from '../actions';

export default async function ExamTypesPage() {
  const me = await getMe();
  const types = await api<ExamType[]>('/exam-types');
  const canChange = canAt(me, 'evaluation.settings.update', {});

  return (
    <>
      <PageHeader
        back={{ href: '/evaluation', label: 'Back to exams' }}
        title="Exam types"
        description="The kinds of exam your organization holds. Every exam has one."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Table>
            <TableHead>
              <tr>
                <Th>Type</Th>
                <Th className="text-right">Exams</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </TableHead>
            <tbody>
              {types.length === 0 && (
                <tr>
                  <Td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No exam types yet. Add the first one, e.g. Quarterly (Q).
                  </Td>
                </tr>
              )}
              {types.map((t) => (
                <tr key={t.id}>
                  <Td>
                    <span className="font-medium">{t.name}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">{t.code}</span>
                    {t.description && (
                      <span className="block text-xs text-muted-foreground">{t.description}</span>
                    )}
                  </Td>
                  <Td className="text-right">{t.examCount}</Td>
                  <Td>
                    <Badge variant={t.isActive ? 'success' : 'outline'}>
                      {t.isActive ? 'In use' : 'Switched off'}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    {canChange && (
                      <div className="flex justify-end gap-1">
                        <ActionForm
                          action={setExamTypeActive.bind(null, t.id, !t.isActive)}
                          submitLabel={t.isActive ? 'Switch off' : 'Switch on'}
                          pendingLabel="…"
                          submitVariant="outline"
                          submitSize="sm"
                        />
                        {t.examCount === 0 && (
                          <ActionForm
                            action={deleteExamType.bind(null, t.id)}
                            submitLabel="Delete"
                            pendingLabel="…"
                            confirmMessage={`Delete the exam type "${t.name}"?`}
                            submitVariant="destructive"
                            submitSize="sm"
                          />
                        )}
                      </div>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        {canChange && (
          <Card>
            <CardHeader>
              <CardTitle>Add an exam type</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm action={createExamType} submitLabel="Add exam type" resetOnSuccess>
                <Field label="Name *" htmlFor="typeName">
                  <Input
                    id="typeName"
                    name="name"
                    required
                    maxLength={100}
                    placeholder="Quarterly"
                  />
                </Field>
                <Field label="Code *" htmlFor="typeCode" hint="Short and unique, e.g. Q, HY, WT">
                  <Input
                    id="typeCode"
                    name="code"
                    required
                    maxLength={20}
                    pattern="[A-Za-z0-9_\-]+"
                    title="Letters, digits, _ and - only"
                    placeholder="Q"
                  />
                </Field>
                <Field label="Description" htmlFor="typeDescription">
                  <Input id="typeDescription" name="description" maxLength={300} />
                </Field>
              </ActionForm>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
