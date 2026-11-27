/** /evaluation/exams/:id/report-cards/:studentId: one student's report card PDF (ADR-0036). */
import { apiDownload } from '../../../../../../../lib/api';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; studentId: string }> },
) {
  const { id, studentId } = await params;
  return apiDownload(`/exams/${id}/report-cards/${studentId}`);
}
