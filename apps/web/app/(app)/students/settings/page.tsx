/**
 * /students/settings: per institution, how admission numbers are made, and which documents
 * are collected from students (document types: required? visible to parents in the portal?).
 * With a pattern, an admission (or import row) with an empty admission number gets the next
 * number; numbers typed by hand still work. Needs "students.settings.update" for the institution.
 */
import {
  ActionForm,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  EmptyState,
  Field,
  Input,
  PageHeader,
} from '@eduplatform/ui';
import { Settings } from 'lucide-react';
import { api } from '../../../../lib/api';
import { can, canAt, getMe } from '../../../../lib/me';
import type { DocumentType, Institution } from '../../../../lib/types';
import {
  createDocumentType,
  deleteDocumentType,
  setNumbering,
  updateDocumentType,
} from '../actions';

export default async function StudentSettingsPage() {
  const me = await getMe();
  const institutions = (
    can(me, 'platform.institution.view') ? await api<Institution[]>('/institutions') : []
  ).filter((i) => canAt(me, 'students.settings.update', { institutionId: i.id }));

  if (institutions.length === 0) {
    return (
      <>
        <PageHeader
          back={{ href: '/students', label: 'Back to students' }}
          title="Student settings"
        />
        <EmptyState
          icon={<Settings />}
          title="Nothing to set"
          description="Your roles don't allow changing student settings for any institution."
        />
      </>
    );
  }

  const documentTypes = can(me, 'students.document.view')
    ? await api<DocumentType[]>('/document-types')
    : [];

  return (
    <>
      <PageHeader
        back={{ href: '/students', label: 'Back to students' }}
        title="Student settings"
        description="Automatic admission numbers, per institution."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {institutions.map((institution) => (
          <Card key={institution.id}>
            <CardHeader>
              <CardTitle>{institution.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm action={setNumbering.bind(null, institution.id)} submitLabel="Save">
                <Field
                  label="Admission number pattern"
                  htmlFor={`pattern-${institution.id}`}
                  hint="{CODE} = institution code, {YY} or {YYYY} = year (restarts every year), {SEQ:4} = running number. Empty = typed by hand."
                >
                  <Input
                    id={`pattern-${institution.id}`}
                    name="pattern"
                    defaultValue={institution.admissionNoPattern ?? ''}
                    placeholder="{CODE}{YY}{SEQ:4}"
                  />
                </Field>
              </ActionForm>
              <DocumentTypes
                institutionId={institution.id}
                types={documentTypes.filter((t) => t.institutionId === institution.id)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

/** The institution's document types with switches, and a form to add one. */
function DocumentTypes({ institutionId, types }: { institutionId: string; types: DocumentType[] }) {
  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="mb-2 text-sm font-semibold">Documents collected from students</h3>
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
                submitVariant="ghost"
                submitSize="sm"
              />
            )}
          </li>
        ))}
      </ul>
      <ActionForm
        action={createDocumentType.bind(null, institutionId)}
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
    </div>
  );
}
