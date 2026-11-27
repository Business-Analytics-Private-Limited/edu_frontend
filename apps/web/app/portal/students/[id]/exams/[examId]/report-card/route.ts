/**
 * /portal/students/:id/exams/:examId/report-card: a parent's or student's report card PDF for a
 * LOCKED exam (backend ADR-0036). The API checks the student is theirs.
 */
import { apiDownload } from '../../../../../../../lib/api';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; examId: string }> },
) {
  const { id, examId } = await params;
  return apiDownload(`/portal/students/${id}/exams/${examId}/report-card`);
}
