/**
 * /evaluation/uploads/:id: one marks upload (MKS-0001 …, backend ADR-0035): when, who, the file,
 * how many rows were saved, and the rows left out with their reasons and values, so they can be
 * fixed and uploaded again.
 */
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  Table,
  TableHead,
  Td,
  Th,
} from '@eduplatform/ui';
import { api } from '../../../../../lib/api';
import type { MarksUpload } from '../../../../../lib/types';

export default async function MarksUploadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const upload = await api<MarksUpload>(`/marks-uploads/${id}`);
  const excluded = upload.excludedRows ?? [];

  return (
    <>
      <PageHeader
        back={{ href: `/evaluation/exams/${upload.examId}`, label: 'Back to the exam' }}
        title={`Marks upload ${upload.code}`}
        description={`${upload.exam?.name ?? ''} · ${new Date(upload.createdAt).toLocaleString()} · by ${
          upload.uploadedByName || 'unknown'
        }${upload.fileName ? ` · ${upload.fileName}` : ''}`}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ['Rows in the file', upload.totalRows],
          ['Students saved', upload.savedCount],
          ['Rows left out', upload.excludedCount],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold tabular-nums">{value}</CardContent>
          </Card>
        ))}
      </div>
      {excluded.length > 0 ? (
        <>
          <h2 className="mb-3 text-lg font-semibold">Rows left out</h2>
          <Table>
            <TableHead>
              <tr>
                <Th>Row</Th>
                <Th>Admission no</Th>
                <Th>Why</Th>
                <Th>Values in the file</Th>
              </tr>
            </TableHead>
            <tbody>
              {excluded.map((e) => (
                <tr key={e.row}>
                  <Td className="tabular-nums">{e.row}</Td>
                  <Td className="font-mono">{e.admissionNo ?? '—'}</Td>
                  <Td>
                    <ul className="grid gap-1">
                      {e.reasons.map((r) => (
                        <li key={r}>
                          <Badge variant="warning">{r}</Badge>
                        </li>
                      ))}
                    </ul>
                  </Td>
                  <Td className="text-xs text-muted-foreground">
                    {Object.entries(e.values)
                      .map(([k, v]) => `${k}: ${v || '—'}`)
                      .join(' · ')}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Every row of the file was saved.</p>
      )}
    </>
  );
}
