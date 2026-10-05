/**
 * /institutions/:id: one institution and its campuses.
 * Each button needs its own permission AT THIS PLACE: platform.institution.update to rename the
 * institution, platform.campus.create / .update / .delete for campuses. Deleting an institution
 * is for the super admin only (ADR-0025). A Campus admin sees
 * only their own campus here (the API sends only the campuses they may see).
 */
import {
  ActionForm,
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
import { createCampus, deleteCampus, renameCampus, updateInstitution } from '../actions';

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
  const canDeleteCampus = canAt(me, 'platform.campus.delete', here);

  return (
    <>
      <PageHeader title={institution.name} description={`Code: ${institution.code}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Campuses</h2>
          <Table>
            <TableHead>
              <tr>
                <Th>Name</Th>
                <Th>Code</Th>
                {canDeleteCampus && <Th />}
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
                  {canDeleteCampus && (
                    <Td className="text-right">
                      <ActionForm
                        action={deleteCampus.bind(null, institution.id, campus.id)}
                        submitLabel="Delete"
                        pendingLabel="Deleting…"
                        confirmMessage={`Delete campus ${campus.name}?`}
                        submitVariant="ghost"
                        submitSize="sm"
                      />
                    </Td>
                  )}
                </tr>
              ))}
              {institution.campuses.length === 0 && (
                <tr>
                  <Td colSpan={3} className="py-8 text-center text-muted-foreground">
                    No campuses yet.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        <div className="flex flex-col gap-6">
          {canAddCampus && (
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
