/**
 * /institutions/:id: one institution and its campuses.
 * Each button needs its own permission: platform.institution.update / .delete and
 * platform.campus.create / .update / .delete.
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
  Select,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import { can, getMe } from '../../../../lib/me';
import { INSTITUTION_TYPES, type InstitutionDetail } from '../../../../lib/types';
import {
  createCampus,
  deleteCampus,
  deleteInstitution,
  renameCampus,
  updateInstitution,
} from '../actions';

export default async function InstitutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, institution] = await Promise.all([
    getMe(),
    api<InstitutionDetail>(`/institutions/${id}`),
  ]);
  const canEdit = can(me, 'platform.institution.update');
  const canDelete = can(me, 'platform.institution.delete');
  const canAddCampus = can(me, 'platform.campus.create');
  const canRenameCampus = can(me, 'platform.campus.update');
  const canDeleteCampus = can(me, 'platform.campus.delete');

  return (
    <>
      <PageHeader
        title={institution.name}
        description={`${institution.code} · ${INSTITUTION_TYPES[institution.type]}`}
        actions={
          canDelete && (
            <ActionForm
              action={deleteInstitution.bind(null, institution.id)}
              submitLabel="Delete institution"
              pendingLabel="Deleting…"
              confirmMessage="Delete this institution? Its campuses must be deleted first."
              submitVariant="destructive"
              submitSize="sm"
            />
          )
        }
      />

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
                    {canRenameCampus ? (
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
                <CardTitle>Edit institution</CardTitle>
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
                  <Field label="Type" htmlFor="type">
                    <Select id="type" name="type" defaultValue={institution.type}>
                      {Object.entries(INSTITUTION_TYPES).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
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
