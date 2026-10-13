/**
 * The "Documents" card of a student's page: required types still missing, every document with
 * its status (uploaded / verified / rejected and why), download, verify / reject, delete, and an
 * upload form. Each button shows only where the user's roles allow it at the student's branch.
 */
import {
  ActionForm,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  FileInput,
  Input,
  Select,
} from '@eduplatform/ui';
import type { DocumentType, StudentDocuments } from '../../../../lib/types';
import { deleteDocument, reviewDocument, uploadDocument } from '../actions';

const STATUS = {
  UPLOADED: { label: 'To check', variant: 'warning' },
  VERIFIED: { label: 'Verified', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
} as const;

function size(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`;
}

export function DocumentsCard({
  studentId,
  data,
  types,
  can,
}: {
  studentId: string;
  data: StudentDocuments;
  types: DocumentType[];
  can: { upload: boolean; review: boolean; delete: boolean };
}) {
  const activeTypes = types.filter((t) => t.isActive);
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        {data.missing.length > 0 && (
          <p>
            Missing:{' '}
            {data.missing.map((t) => (
              <Badge key={t.id} variant="warning" className="mr-1">
                {t.name}
              </Badge>
            ))}
          </p>
        )}

        {data.documents.length === 0 && <p className="text-muted-foreground">No documents yet.</p>}
        {data.documents.map((d) => (
          <div key={d.id} className="flex flex-col gap-1 border-b pb-3 last:border-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{d.documentType.name}</span>
              <Badge variant={STATUS[d.status].variant}>{STATUS[d.status].label}</Badge>
              <a
                href={`/students/${studentId}/documents/${d.id}`}
                className="text-primary hover:underline"
              >
                {d.file.originalName}
              </a>
              <span className="text-xs text-muted-foreground">{size(d.file.sizeBytes)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Uploaded by {d.uploadedByName} on {new Date(d.createdAt).toLocaleDateString()}
              {d.verifiedByName &&
                ` · ${d.status === 'VERIFIED' ? 'verified' : 'rejected'} by ${d.verifiedByName}`}
              {d.note && ` · ${d.note}`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {can.review && d.status !== 'VERIFIED' && (
                <ActionForm
                  action={reviewDocument.bind(null, studentId, d.id, 'VERIFIED')}
                  submitLabel="Verify"
                  pendingLabel="…"
                  submitVariant="outline"
                  submitSize="sm"
                />
              )}
              {can.review && d.status !== 'REJECTED' && (
                <ActionForm
                  action={reviewDocument.bind(null, studentId, d.id, 'REJECTED')}
                  submitLabel="Reject"
                  pendingLabel="…"
                  submitVariant="ghost"
                  submitSize="sm"
                  className="flex-row items-center gap-2"
                >
                  <Input
                    name="note"
                    placeholder="Why (e.g. blurred)"
                    required
                    className="h-8 w-48"
                  />
                </ActionForm>
              )}
              {can.delete && (
                <ActionForm
                  action={deleteDocument.bind(null, studentId, d.id)}
                  submitLabel="Delete"
                  pendingLabel="…"
                  confirmMessage={`Delete ${d.file.originalName}?`}
                  submitVariant="ghost"
                  submitSize="sm"
                />
              )}
            </div>
          </div>
        ))}

        {can.upload && activeTypes.length > 0 && (
          <details>
            <summary className="cursor-pointer text-primary">+ Upload a document</summary>
            <ActionForm
              action={uploadDocument.bind(null, studentId)}
              submitLabel="Upload"
              pendingLabel="Uploading…"
              resetOnSuccess
              className="mt-3"
            >
              <Field label="Type" htmlFor="documentTypeId">
                <Select id="documentTypeId" name="documentTypeId" required>
                  {activeTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.isRequired ? ' (required)' : ''}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="File" htmlFor="file" hint="PDF, JPG or PNG, up to 5 MB">
                <FileInput
                  id="file"
                  name="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  required
                />
              </Field>
            </ActionForm>
          </details>
        )}
        {can.upload && activeTypes.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No document types yet: add them in Students → Student settings.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
