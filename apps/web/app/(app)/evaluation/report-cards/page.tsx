/**
 * /evaluation/report-cards: how report cards look (backend ADR-0037): the title, a line under the
 * organization's name, a note at the bottom, the signature lines and the logo. Report cards are
 * printed from an exam's page or results (one student, a section, or every section).
 */
import {
  ActionForm,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  FileInput,
  Input,
  PageHeader,
} from '@eduplatform/ui';
import { api } from '../../../../lib/api';
import { can, getMe } from '../../../../lib/me';
import type { ReportCardSettings } from '../../../../lib/types';
import { removeLogo, saveReportCardSettings, uploadLogo } from '../actions';

export default async function ReportCardSettingsPage() {
  const me = await getMe();
  const settings = await api<ReportCardSettings>('/report-card-settings');
  const canChange = can(me, 'evaluation.settings.update');

  return (
    <>
      <PageHeader
        title="Report cards"
        description="How report cards look. Print them from an exam: one student from its results, a section, or the whole exam."
      />
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Text</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={saveReportCardSettings} submitLabel="Save" ownButtons={!canChange}>
              <Field label="Title *" htmlFor="title">
                <Input
                  id="title"
                  name="title"
                  required
                  maxLength={80}
                  defaultValue={settings.title}
                  disabled={!canChange}
                />
              </Field>
              <Field
                label="Line under the name"
                htmlFor="headerLine"
                hint="For example the address or affiliation"
              >
                <Input
                  id="headerLine"
                  name="headerLine"
                  maxLength={200}
                  defaultValue={settings.headerLine ?? ''}
                  disabled={!canChange}
                />
              </Field>
              <Field label="Note at the bottom" htmlFor="footerNote">
                <Input
                  id="footerNote"
                  name="footerNote"
                  maxLength={300}
                  defaultValue={settings.footerNote ?? ''}
                  disabled={!canChange}
                />
              </Field>
              <Field
                label="Signatures"
                htmlFor="signatureLabels"
                hint="Up to four, separated by commas"
              >
                <Input
                  id="signatureLabels"
                  name="signatureLabels"
                  defaultValue={settings.signatureLabels.join(', ')}
                  placeholder="Class teacher, Principal, Parent"
                  disabled={!canChange}
                />
              </Field>
            </ActionForm>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {settings.hasLogo ? (
              <img
                src="/evaluation/report-cards/logo"
                alt="Report card logo"
                className="h-24 w-auto self-start rounded border object-contain p-1"
              />
            ) : (
              <p className="text-sm text-muted-foreground">No logo yet.</p>
            )}
            {canChange && (
              <ActionForm action={uploadLogo} submitLabel="Save logo" resetOnSuccess>
                <Field label="PNG or JPG, at most 5 MB" htmlFor="logoFile">
                  <FileInput id="logoFile" name="file" accept="image/png,image/jpeg" required />
                </Field>
              </ActionForm>
            )}
            {canChange && settings.hasLogo && (
              <ActionForm
                action={removeLogo}
                submitLabel="Remove logo"
                confirmMessage="Remove the logo from report cards?"
                submitVariant="outline"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
