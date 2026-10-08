/**
 * /institutions/:id: one institution and its campuses.
 * Each button needs its own permission AT THIS PLACE: platform.institution.update to rename the
 * institution, platform.campus.create / .update for campuses, platform.campus.delete to
 * DEACTIVATE (close) a campus. Activating a closed campus again, and really deleting an empty
 * one, is for the Organization admin only (ADR-0026). Deleting an institution is for the super
 * admin only (ADR-0025). A Campus admin sees
 * only their own campus here (the API sends only the campuses they may see).
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
import type { InstitutionDetail } from '../../../../lib/types';
import {
  activateCampus,
  createCampus,
  deactivateCampus,
  deleteCampus,
  renameCampus,
  updateInstitution,
} from '../actions';

export default async function InstitutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, institution] = await Promise.all([
    getMe(),
    api<InstitutionDetail>(`/institutions/${id}`),
  ]);
  const here = { institutionId: institution.id };
  const atCampus = (campusId: string) => ({ institutionId: institution.id, campusId });
  const canEdit = canAt(me, 'platform.institution.update', here);
  const canAddCampus = canAt(me, 'platform.campus.create', here);
  const canDeactivate = (campusId: string) =>
    canAt(me, 'platform.campus.delete', atCampus(campusId));
  const showActions = me.isOrganizationAdmin || canAt(me, 'platform.campus.delete', here);
  const closed = institution.status !== 'ACTIVE';

  return (
    <>
      <PageHeader
        back={{ href: '/institutions', label: 'Back to institutions' }}
        title={institution.name}
        description={`Code: ${institution.code}`}
        actions={closed && <Badge variant="outline">Inactive</Badge>}
      />
      {closed && (
        <p className="mb-4 text-sm text-muted-foreground">
          This institution is inactive: its records can be read, but nothing new can be added.
          EduPlatform can activate it again.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Campuses</h2>
          <Table>
            <TableHead>
              <tr>
                <Th>Name</Th>
                <Th>Code</Th>
                <Th>Status</Th>
                {showActions && <Th />}
              </tr>
            </TableHead>
            <tbody>
              {institution.campuses.map((campus) => (
                <tr key={campus.id}>
                  <Td>
                    {canAt(me, 'platform.campus.update', atCampus(campus.id)) ? (
                      <ActionForm
                        action={renameCampus.bind(null, institution.id, campus.id)}
                        submitLabel="Rename"
                        submitVariant="outline"
                        submitSize="sm"
                        className="flex-row items-center gap-2"
                      >
                        <Input
                          name="name"
                          defaultValue={campus.name}
                          required
                          minLength={2}
                          aria-label="Campus name"
                        />
                      </ActionForm>
                    ) : (
                      campus.name
                    )}
                  </Td>
                  <Td>{campus.code}</Td>
                  <Td>
                    <Badge variant={campus.status === 'ACTIVE' ? 'success' : 'outline'}>
                      {campus.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  {showActions && (
                    <Td>
                      <div className="flex justify-end gap-1">
                        {campus.status === 'ACTIVE' && canDeactivate(campus.id) && (
                          <ActionForm
                            action={deactivateCampus.bind(null, institution.id, campus.id)}
                            submitLabel="Deactivate"
                            pendingLabel="…"
                            confirmMessage={`Deactivate ${campus.name}? Its records are kept and can still be read, but nothing new can be added there, and staff roles at this campus stop working. Only the Organization admin can activate it again.`}
                            submitVariant="outline"
                            submitSize="sm"
                          />
                        )}
                        {campus.status === 'INACTIVE' && me.isOrganizationAdmin && !closed && (
                          <ActionForm
                            action={activateCampus.bind(null, institution.id, campus.id)}
                            submitLabel="Activate"
                            pendingLabel="…"
                            submitVariant="outline"
                            submitSize="sm"
                          />
                        )}
                        {me.isOrganizationAdmin && (
                          <ActionForm
                            action={deleteCampus.bind(null, institution.id, campus.id)}
                            submitLabel="Delete"
                            pendingLabel="…"
                            confirmMessage={`Delete ${campus.name} for good? Only an empty campus (no classes, students or holidays) can be deleted; otherwise deactivate it.`}
                            submitVariant="ghost"
                            submitSize="sm"
                          />
                        )}
                      </div>
                    </Td>
                  )}
                </tr>
              ))}
              {institution.campuses.length === 0 && (
                <tr>
                  <Td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No campuses yet.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        <div className="flex flex-col gap-6">
          {canAddCampus && !closed && (
            <Card>
              <CardHeader>
                <CardTitle>Add campus</CardTitle>
              </CardHeader>
              <CardContent>
                <ActionForm
                  action={createCampus.bind(null, institution.id)}
                  submitLabel="Add campus"
                  resetOnSuccess
                >
                  <Field label="Name" htmlFor="campusName">
                    <Input
                      id="campusName"
                      name="name"
                      required
                      minLength={2}
                      placeholder="Kukatpally"
                    />
                  </Field>
                  <Field label="Code" htmlFor="campusCode" hint="Capital letters, digits, _ and -">
                    <Input
                      id="campusCode"
                      name="code"
                      required
                      pattern="[A-Z0-9_\-]{2,20}"
                      placeholder="KKP"
                    />
                  </Field>
                </ActionForm>
              </CardContent>
            </Card>
          )}

          {canEdit && (
            <Card>
              <CardHeader>
                <CardTitle>Rename institution</CardTitle>
              </CardHeader>
              <CardContent>
                <ActionForm
                  action={updateInstitution.bind(null, institution.id)}
                  submitLabel="Save"
                >
                  <Field label="Name" htmlFor="name">
                    <Input
                      id="name"
                      name="name"
                      defaultValue={institution.name}
                      required
                      minLength={2}
                    />
                  </Field>
                </ActionForm>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
