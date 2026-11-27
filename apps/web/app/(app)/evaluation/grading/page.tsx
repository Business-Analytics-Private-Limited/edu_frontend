/**
 * /evaluation/grading: the organization's grading schemes (backend ADR-0036). A scheme turns a
 * percentage into a grade (A+, A, B …) and, when every grade has a point, a GPA. One scheme is
 * the default; an exam can use another one. A scheme that exams use can't be deleted.
 */
import {
  ActionForm,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { can, getMe } from '../../../../lib/me';
import type { GradingScheme } from '../../../../lib/types';
import { deleteGradingScheme, makeSchemeDefault } from '../actions';
import { SchemeForm } from './scheme-form';

export default async function GradingPage() {
  const me = await getMe();
  const schemes = await api<GradingScheme[]>('/grading-schemes');
  const canChange = can(me, 'evaluation.settings.update');

  return (
    <>
      <PageHeader
        title="Grades"
        description="Grading schemes turn a percentage into a grade, per subject and overall. Exams use the default unless they choose another."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid content-start gap-4 lg:col-span-2">
          {schemes.length === 0 && (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No grading schemes yet: results show marks and percentages only.
            </p>
          )}
          {schemes.map((scheme) => (
            <Card key={scheme.id}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex flex-wrap items-center gap-2">
                  {scheme.name}
                  {scheme.isDefault && <Badge variant="success">Default</Badge>}
                  <span className="text-xs font-normal text-muted-foreground">
                    {scheme.examCount ?? 0} exam(s) chose it
                  </span>
                </CardTitle>
                {canChange && (
                  <div className="flex flex-wrap gap-1">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/evaluation/grading/${scheme.id}`}>Edit</Link>
                    </Button>
                    {!scheme.isDefault && (
                      <ActionForm
                        action={makeSchemeDefault.bind(null, scheme.id)}
                        submitLabel="Make default"
                        pendingLabel="…"
                        submitVariant="outline"
                        submitSize="sm"
                      />
                    )}
                    {(scheme.examCount ?? 0) === 0 && (
                      <ActionForm
                        action={deleteGradingScheme.bind(null, scheme.id)}
                        submitLabel="Delete"
                        pendingLabel="…"
                        confirmMessage={`Delete the grading scheme "${scheme.name}"?`}
                        submitVariant="destructive"
                        submitSize="sm"
                      />
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 text-sm">
                  {scheme.bands.map((b) => (
                    <span key={b.grade} className="rounded-lg border px-2 py-1">
                      <span className="font-semibold">{b.grade}</span>
                      <span className="ml-1 text-muted-foreground">
                        from {b.minPercentage}%
                        {b.gradePoint !== null ? ` · ${b.gradePoint} pt` : ''}
                        {b.remark ? ` · ${b.remark}` : ''}
                      </span>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {canChange && (
          <Card>
            <CardHeader>
              <CardTitle>Add grading scheme</CardTitle>
            </CardHeader>
            <CardContent>
              <SchemeForm />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
