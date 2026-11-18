/**
 * /students/settings: for the whole organization (ADR-0030):
 *   - admission numbers: AUTOMATIC (from a pattern; typed numbers are ignored) or typed in
 *     (MANUAL; required in the form and the import sheet);
 *   - the documents collected from students (document types: required? visible to parents?).
 * Needs "students.settings.update" for the whole organization (the Organization admin).
 */
import {
  ActionForm,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  EmptyState,
  Input,
  PageHeader,
} from '@eduplatform/ui';
import { Settings } from 'lucide-react';
import { api } from '../../../../lib/api';
import { canAt, getMe } from '../../../../lib/me';
import type { DocumentType, OwnOrganization } from '../../../../lib/types';
import { createDocumentType, deleteDocumentType, updateDocumentType } from '../actions';
import { NumberingForm } from '../numbering-form';

export default async function StudentSettingsPage() {
  const me = await getMe();
  if (!canAt(me, 'students.settings.update', {})) {
    return (
      <>
        <PageHeader title="Student settings" />
        <EmptyState
          icon={<Settings />}
          title="Nothing to set up here"
          description="Student settings are for the whole organization (the Organization admin)."
        />
      </>
    );
  }
  const [organization, documentTypes] = await Promise.all([
    api<OwnOrganization>('/organization'),
    api<DocumentType[]>('/document-types'),
  ]);

  return (
    <>
      <PageHeader title="Student settings" description="For the whole organization." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Admission numbers</CardTitle>
            <CardDescription>
              Changing this never renumbers students who are already admitted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NumberingForm organization={organization} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents collected from students</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentTypes types={documentTypes} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/** The organization's document types with switches, and a form to add one. */
function DocumentTypes({ types }: { types: DocumentType[] }) {
  return (
    <>
      <ul className="mb-3 flex flex-col gap-2 text-sm">
        {types.length === 0 && <li className="text-muted-foreground">None yet.</li>}
        {types.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center gap-2">
            <span className={t.isActive ? 'font-medium' : 'text-muted-foreground line-through'}>
              {t.name}
            </span>
            {t.isRequired && <Badge variant="warning">required</Badge>}
            {t.visibleInPortal && <Badge variant="outline">parents see it</Badge>}
            <ActionForm
              action={updateDocumentType.bind(null, t.id, { isRequired: !t.isRequired })}
              submitLabel={t.isRequired ? 'Make optional' : 'Make required'}
              pendingLabel="…"
              submitVariant="ghost"
              submitSize="sm"
            />
            <ActionForm
              action={updateDocumentType.bind(null, t.id, { visibleInPortal: !t.visibleInPortal })}
              submitLabel={t.visibleInPortal ? 'Hide from parents' : 'Show to parents'}
              pendingLabel="…"
              submitVariant="ghost"
              submitSize="sm"
            />
            {t._count.documents > 0 ? (
              <ActionForm
                action={updateDocumentType.bind(null, t.id, { isActive: !t.isActive })}
                submitLabel={t.isActive ? 'Not in use' : 'Use again'}
                pendingLabel="…"
                submitVariant="ghost"
                submitSize="sm"
              />
            ) : (
              <ActionForm
                action={deleteDocumentType.bind(null, t.id)}
                submitLabel="Delete"
                pendingLabel="…"
                confirmMessage={`Delete the document type ${t.name}?`}
                submitVariant="destructive"
                submitSize="sm"
              />
            )}
          </li>
        ))}
      </ul>
      <ActionForm
        action={createDocumentType}
        submitLabel="Add document type"
        submitSize="sm"
        resetOnSuccess
      >
        <Input
          name="name"
          placeholder="e.g. Transfer certificate"
          required
          aria-label="Document type"
        />
        <Checkbox name="isRequired" label="Required" />
        <Checkbox name="visibleInPortal" label="Parents and students can see it in the portal" />
      </ActionForm>
    </>
  );
}
