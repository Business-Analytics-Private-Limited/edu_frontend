/**
 * /academic/batches: students who joined together and move on together, e.g. "2026-28" or
 * "Long term 2026". The STAGE is in the institution's own words (Junior, Senior, Long term,
 * Passed out, ...); promotion in the Students module will move batches on.
 * Managing batches needs "academic.batch.*" for the institution.
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
  Select,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import { can, canAt, getMe } from '../../../../lib/me';
import type { Batch, Institution } from '../../../../lib/types';
import { createBatch, deleteBatch, updateBatch } from '../actions';

/** Suggestions only: an institution can type any stage. */
const STAGE_SUGGESTIONS = ['Junior', 'Senior', 'Long term', 'Passed out'];

export default async function BatchesPage() {
  const me = await getMe();
  const [batches, institutions] = await Promise.all([
    api<Batch[]>('/batches'),
    can(me, 'platform.institution.view') ? api<Institution[]>('/institutions') : [],
  ]);
  const canCreateIn = institutions.filter((i) =>
    canAt(me, 'academic.batch.create', { institutionId: i.id }),
  );
  // Stages already used, plus the suggestions, for the stage fields.
  const stages = [...new Set([...batches.map((b) => b.stage), ...STAGE_SUGGESTIONS])];

  return (
    <>
      <PageHeader
        title="Batches"
        description="Students who joined together; the stage says where the batch is now."
      />
      <datalist id="stages">
        {stages.map((stage) => (
          <option key={stage} value={stage} />
        ))}
      </datalist>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <TableHead>
              <tr>
                <Th>Institution</Th>
                <Th>Batch</Th>
                <Th>Stage</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </TableHead>
            <tbody>
              {batches.map((batch) => {
                const here = { institutionId: batch.institutionId };
                const canEdit = canAt(me, 'academic.batch.update', here);
                return (
                  <tr key={batch.id}>
                    <Td>{batch.institution.name}</Td>
                    <Td>
                      <span className="font-medium">{batch.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{batch.code}</span>
                    </Td>
                    <Td>
                      {canEdit ? (
                        <ActionForm
                          action={updateBatch.bind(null, batch.id)}
                          submitLabel="Save"
                          submitVariant="outline"
                          submitSize="sm"
                          className="flex-row items-center gap-2"
                        >
                          <Input
                            name="stage"
                            list="stages"
                            defaultValue={batch.stage}
                            required
                            className="w-32"
                            aria-label="Stage"
                          />
                          <Select
                            name="status"
                            defaultValue={batch.status}
                            className="w-32"
                            aria-label="Status"
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="COMPLETED">Completed</option>
                          </Select>
                        </ActionForm>
                      ) : (
                        batch.stage
                      )}
                    </Td>
                    <Td>
                      <Badge variant={batch.status === 'ACTIVE' ? 'success' : 'outline'}>
                        {batch.status}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      {canAt(me, 'academic.batch.delete', here) && (
                        <ActionForm
                          action={deleteBatch.bind(null, batch.id)}
                          submitLabel="Delete"
                          pendingLabel="…"
                          confirmMessage={`Delete the batch ${batch.name}?`}
                          submitVariant="ghost"
                          submitSize="sm"
                        />
                      )}
                    </Td>
                  </tr>
                );
              })}
              {batches.length === 0 && (
                <tr>
                  <Td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No batches yet.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {canCreateIn.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Add batch</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm action={createBatch} submitLabel="Add batch" resetOnSuccess>
                <Field label="Institution" htmlFor="institutionId">
                  <Select id="institutionId" name="institutionId" required>
                    {canCreateIn.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Name" htmlFor="batchName">
                  <Input id="batchName" name="name" required placeholder="2026-28 batch" />
                </Field>
                <Field label="Code" htmlFor="batchCode" hint="Unique in the institution">
                  <Input
                    id="batchCode"
                    name="code"
                    required
                    placeholder="B2026"
                    pattern="[A-Za-z0-9_\-]{1,20}"
                  />
                </Field>
                <Field label="Stage" htmlFor="stage" hint="Your own words, e.g. Junior, Senior">
                  <Input id="stage" name="stage" list="stages" required placeholder="Junior" />
                </Field>
              </ActionForm>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
