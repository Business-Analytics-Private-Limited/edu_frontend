/**
 * /portal/students/:id/documents/:docId : a parent or student downloads a document of a linked
 * student (only types the school made visible in the portal; the API checks it).
 */
import { apiDownload } from '../../../../../../lib/api';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const { id, docId } = await params;
  return apiDownload(`/portal/students/${id}/documents/${docId}/file`);
}
