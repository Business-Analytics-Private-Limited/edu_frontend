/**
 * /students/:id/documents/:docId : downloads a student's document (staff), through the API with
 * the user's token. The API checks "students.document.view" at the student's campus.
 */
import { apiDownload } from '../../../../../../lib/api';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const { id, docId } = await params;
  return apiDownload(`/students/${id}/documents/${docId}/file`);
}
