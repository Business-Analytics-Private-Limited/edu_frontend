/**
 * /evaluation/grading/:id: change a grading scheme's name or grades (backend ADR-0037). Results
 * and report cards of every exam that uses it show the new grades.
 */
import { Card, CardContent, PageHeader } from '@eduplatform/ui';
import { notFound } from 'next/navigation';
import { api } from '../../../../../lib/api';
import type { GradingScheme } from '../../../../../lib/types';
import { SchemeForm } from '../scheme-form';

export default async function EditSchemePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scheme = (await api<GradingScheme[]>('/grading-schemes')).find((s) => s.id === id);
  if (!scheme) notFound();

  return (
    <>
      <PageHeader
        back={{ href: '/evaluation/grading', label: 'Back to grades' }}
        title={`Edit ${scheme.name}`}
        description="Results and report cards of every exam using this scheme show the new grades."
      />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <SchemeForm scheme={scheme} />
        </CardContent>
      </Card>
    </>
  );
}
