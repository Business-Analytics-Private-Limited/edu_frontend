/**
 * /evaluation/exams/:id/upload: upload a CSV of marks for this exam (backend ADR-0035).
 *   1. Download the template: one row per student (admissionNo, name, section) and one column
 *      per subject code, with marks already entered.
 *   2. Fill it in: a number, AB (absent), EX (exempt); leave a box empty to keep it as it is. A
 *      file may hold only some subjects' columns (one teacher, one subject).
 *   3. "Check the file" saves nothing; "Upload marks" saves the valid rows and opens the upload
 *      record (MKS-0001 …) with the rows left out and why.
 */
import {
  ActionForm,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  FileInput,
  PageHeader,
} from '@eduplatform/ui';
import { Download } from 'lucide-react';
import { api } from '../../../../../../lib/api';
import type { ExamDetail } from '../../../../../../lib/types';
import { uploadMarks } from '../../../actions';

export default async function UploadMarksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = await api<ExamDetail>(`/exams/${id}`);
  const codes = exam.subjects.map((s) => s.code).join(', ');

  return (
    <>
      <PageHeader
        back={{ href: `/evaluation/exams/${id}`, label: 'Back to the exam' }}
        title={`${exam.name}: upload marks`}
        description={`${exam.appliesTo.label} · ${exam.branch?.name ?? 'Every branch'}`}
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>The file</CardTitle>
          </CardHeader>
          <CardContent>
            {exam.status === 'LOCKED' ? (
              <p className="text-sm text-muted-foreground">
                The exam is locked: unlock it to upload marks.
              </p>
            ) : (
              <ActionForm
                action={uploadMarks.bind(null, id)}
                submitLabel="Check the file"
                submitName="intent"
                submitValue="check"
                submitVariant="outline"
                secondary={{
                  label: 'Upload marks',
                  name: 'intent',
                  value: 'upload',
                  variant: 'default',
                }}
              >
                <Field label="CSV file" htmlFor="file" hint="Up to 5000 rows">
                  <FileInput id="file" name="file" accept=".csv,text/csv" required />
                </Field>
              </ActionForm>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>How to fill it in</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <a
              href={`/evaluation/exams/${id}/template`}
              className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
            >
              <Download className="size-4" /> Download the template (your students, marks so far)
            </a>
            <ul className="grid list-disc gap-1 pl-5 text-muted-foreground">
              <li>
                <code>admissionNo</code> finds the student; <code>name</code> and{' '}
                <code>section</code> are only there to help.
              </li>
              <li>
                One column per subject: <code>{codes}</code>. A file may hold only some of them.
              </li>
              <li>
                A number up to the subject&apos;s maximum, <code>AB</code> for absent,{' '}
                <code>EX</code> for exempt. An empty box keeps the mark as it is; <code>-</code>{' '}
                marks a subject the student&apos;s section doesn&apos;t have.
              </li>
              <li>
                Rows with a problem are left out and listed with the reason; the others are saved.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
