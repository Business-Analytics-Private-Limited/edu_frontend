/**
 * /evaluation/exams/:id: one exam (backend ADR-0035): where it applies, its subjects with
 * maximum and pass marks, and every section taking part with its students and how many marks are
 * in. From here: enter a section's marks, upload a CSV of marks, see results, lock / unlock.
 * Upload records of this exam are listed at the bottom. Part 2 (ADR-0037): the chapters each
 * subject covers, the grades used (changeable), the overview and the report cards (one PDF for the
 * exam or per section).
 */
import {
  ActionForm,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  PageHeader,
  Select,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { BarChart3, FileText, PieChart, Upload } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../../../lib/api';
import { can, canAt, getMe } from '../../../../../lib/me';
import type { ExamDetail, GradingScheme, MarksUpload } from '../../../../../lib/types';
import { deleteExam, setExamLocked, setExamScheme } from '../../actions';

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getMe();
  const exam = await api<ExamDetail>(`/exams/${id}`);
  const uploads = can(me, 'evaluation.marks.view')
    ? await api<MarksUpload[]>(`/exams/${id}/uploads`)
    : [];
  const schemes = await api<GradingScheme[]>('/grading-schemes');
  const place = { branchId: exam.branch?.id };
  const canSeeMarks = can(me, 'evaluation.marks.view');
  const canUpdate = canAt(me, 'evaluation.exam.update', place);
  const marksIn = exam.sections.reduce((n, s) => n + s.marksEntered, 0);
  const marksExpected = exam.sections.reduce((n, s) => n + s.marksExpected, 0);
  const open = exam.status === 'OPEN';

  return (
    <>
      <PageHeader
        back={{ href: '/evaluation', label: 'Back to exams' }}
        title={exam.name}
        description={`${exam.examType.name} · ${exam.academicYear.name} · ${exam.appliesTo.label} · ${
          exam.branch?.name ?? 'Every branch'
        } · ${exam.startsOn === exam.endsOn ? exam.startsOn : `${exam.startsOn} to ${exam.endsOn}`}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant={open ? 'success' : 'outline'} className="self-center">
              {open ? 'Open for marks' : 'Locked'}
            </Badge>
            {open && can(me, 'evaluation.marks.import') && (
              <Button asChild variant="outline">
                <Link href={`/evaluation/exams/${id}/upload`}>
                  <Upload /> Upload marks
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={`/evaluation/exams/${id}/results`}>
                <BarChart3 /> Results
              </Link>
            </Button>
            {canSeeMarks && (
              <Button asChild variant="outline">
                <Link href={`/evaluation/exams/${id}/overview`}>
                  <PieChart /> Overview
                </Link>
              </Button>
            )}
            {canSeeMarks && (
              <Button asChild variant="outline">
                {/* One PDF, a page per student the user may see (route handler). */}
                <a href={`/evaluation/exams/${id}/report-cards`}>
                  <FileText /> Report cards
                </a>
              </Button>
            )}
            {canUpdate && (
              <ActionForm
                action={setExamLocked.bind(null, id, open)}
                submitLabel={open ? 'Lock' : 'Unlock'}
                pendingLabel="…"
                confirmMessage={
                  open
                    ? 'Lock this exam? No marks can be entered or uploaded until it is unlocked.'
                    : 'Unlock this exam? Marks can then be changed again.'
                }
                submitVariant="outline"
              />
            )}
            {canAt(me, 'evaluation.exam.delete', place) && marksIn === 0 && (
              <ActionForm
                action={deleteExam.bind(null, id)}
                submitLabel="Delete"
                pendingLabel="…"
                confirmMessage={`Delete the exam "${exam.name}"? It has no marks yet.`}
                submitVariant="destructive"
              />
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Subjects</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {exam.subjects.map((s) => (
              <div
                key={s.subjectId}
                className="flex items-baseline justify-between gap-3 border-b pb-2 last:border-0"
              >
                <span>
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{s.code}</span>
                  {s.examDate && (
                    <span className="block text-xs text-muted-foreground">{s.examDate}</span>
                  )}
                  {s.portion && (
                    <span className="block text-xs text-muted-foreground">
                      Portion: {s.portion}
                    </span>
                  )}
                  {s.chapters.length > 0 && (
                    <span className="block text-xs text-muted-foreground">
                      Chapters: {s.chapters.map((c) => c.name).join(', ')}
                    </span>
                  )}
                </span>
                <span className="whitespace-nowrap tabular-nums">
                  max {s.maxMarks} · pass {s.passMarks}
                </span>
              </div>
            ))}
            <div className="mt-2 border-t pt-3">
              <p className="font-medium">Grades</p>
              <p className="text-xs text-muted-foreground">
                {exam.gradingScheme
                  ? `${exam.gradingScheme.name}${exam.gradingScheme.own ? '' : ' (the default)'}`
                  : 'None: marks and percentages only (add grades in Evaluation → Grades)'}
              </p>
              {canUpdate && schemes.length > 0 && (
                <ActionForm
                  action={setExamScheme.bind(null, id)}
                  submitLabel="Change grades"
                  submitVariant="outline"
                  submitSize="sm"
                  className="mt-2 gap-2"
                >
                  <Field label="Grades used" htmlFor="gradingSchemeId">
                    <Select
                      id="gradingSchemeId"
                      name="gradingSchemeId"
                      defaultValue={exam.gradingScheme?.own ? exam.gradingScheme.id : ''}
                    >
                      <option value="">The default</option>
                      {schemes.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </ActionForm>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="min-w-0 lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">Sections taking part</h2>
            <span className="text-sm text-muted-foreground tabular-nums">
              {marksIn} of {marksExpected} marks in
            </span>
          </div>
          <Table>
            <TableHead>
              <tr>
                <Th>Section</Th>
                <Th className="text-right">Students</Th>
                <Th className="text-right">Marks in</Th>
                <Th />
              </tr>
            </TableHead>
            <tbody>
              {exam.sections.map((s) => (
                <tr key={s.id}>
                  <Td>
                    {s.label}
                    <span className="block text-xs text-muted-foreground">{s.branchName}</span>
                    {/* Only when the section doesn't have every subject of the exam. */}
                    {s.subjectIds.length < exam.subjects.length && (
                      <span className="block text-xs text-muted-foreground">
                        Subjects:{' '}
                        {exam.subjects
                          .filter((sub) => s.subjectIds.includes(sub.subjectId))
                          .map((sub) => sub.code)
                          .join(', ') || 'none'}
                      </span>
                    )}
                  </Td>
                  <Td className="text-right tabular-nums">{s.students}</Td>
                  <Td className="text-right tabular-nums">
                    {s.marksEntered} / {s.marksExpected}
                  </Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      {canAt(me, 'evaluation.marks.view', { branchId: s.branchId }) && (
                        <Button asChild variant={s.canEnter ? 'default' : 'outline'} size="sm">
                          <Link href={`/evaluation/exams/${id}/marks?sectionId=${s.id}`}>
                            {s.canEnter ? 'Enter marks' : 'View marks'}
                          </Link>
                        </Button>
                      )}
                      {canAt(me, 'evaluation.marks.view', { branchId: s.branchId }) && (
                        <Button asChild variant="outline" size="sm">
                          <a href={`/evaluation/exams/${id}/report-cards?sectionId=${s.id}`}>
                            Report cards
                          </a>
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {uploads.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 text-lg font-semibold">Marks uploads</h2>
          <Table>
            <TableHead>
              <tr>
                <Th>Upload</Th>
                <Th>When</Th>
                <Th>By</Th>
                <Th className="text-right">Rows</Th>
                <Th className="text-right">Saved</Th>
                <Th className="text-right">Left out</Th>
              </tr>
            </TableHead>
            <tbody>
              {uploads.map((u) => (
                <tr key={u.id}>
                  <Td>
                    <Link
                      href={`/evaluation/uploads/${u.id}`}
                      className="font-mono font-medium text-primary hover:underline"
                    >
                      {u.code}
                    </Link>
                    {u.fileName && (
                      <span className="block text-xs text-muted-foreground">{u.fileName}</span>
                    )}
                  </Td>
                  <Td>{new Date(u.createdAt).toLocaleString()}</Td>
                  <Td>{u.uploadedByName || '—'}</Td>
                  <Td className="text-right">{u.totalRows}</Td>
                  <Td className="text-right">{u.savedCount}</Td>
                  <Td className="text-right">
                    {u.excludedCount > 0 ? <Badge variant="warning">{u.excludedCount}</Badge> : 0}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </>
  );
}
