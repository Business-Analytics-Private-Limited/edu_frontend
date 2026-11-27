/**
 * /evaluation/exams/:id/report-cards?sectionId=&branchId=: report cards in one PDF (backend
 * ADR-0037), a page per student: one section, one branch, or every section the user may see.
 * The token stays on the server; the PDF is passed through.
 */
import { apiDownload } from '../../../../../../lib/api';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const from = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of ['sectionId', 'branchId']) {
    const value = from.get(key);
    if (value) query.set(key, value);
  }
  return apiDownload(`/exams/${id}/report-cards${query.size > 0 ? `?${query}` : ''}`);
}
