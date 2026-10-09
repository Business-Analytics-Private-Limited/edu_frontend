/**
 * /branches/:id: one branch. Rename it ("platform.branch.update" here), and go to its sections,
 * students and attendance. Closing and reopening a branch is EduPlatform's (ADR-0026, ADR-0030).
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
  Input,
  PageHeader,
} from '@eduplatform/ui';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { can, canAt, getMe } from '../../../../lib/me';
import type { Branch } from '../../../../lib/types';
import { renameBranch } from '../actions';

export default async function BranchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, branch] = await Promise.all([getMe(), api<Branch>(`/branches/${id}`)]);
  const closed = branch.status !== 'ACTIVE';
  const links = [
    {
      href: `/academic/sections?branch=${id}`,
      label: 'Sections',
      show: me.enabledModules.includes('academic') && can(me, 'academic.structure.view'),
    },
    {
      href: `/students?branchId=${id}`,
      label: 'Students',
      show: me.enabledModules.includes('students') && can(me, 'students.student.view'),
    },
    {
      href: `/attendance?branchId=${id}`,
      label: 'Attendance today',
      show: me.enabledModules.includes('attendance') && can(me, 'attendance.record.view'),
    },
  ].filter((l) => l.show);

  return (
    <>
      <PageHeader
        back={{ href: '/branches', label: 'Back to branches' }}
        title={branch.name}
        description={`Code: ${branch.code}`}
        actions={closed && <Badge variant="outline">Inactive</Badge>}
      />
      {closed && (
        <p className="mb-6 max-w-3xl rounded-md border px-4 py-2 text-sm text-muted-foreground">
          This branch is closed: its records stay readable, but nothing new happens here. Only
          EduPlatform can open it again.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        {canAt(me, 'platform.branch.update', { branchId: id }) && (
          <Card>
            <CardHeader>
              <CardTitle>Name</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm action={renameBranch.bind(null, id)} submitLabel="Rename">
                <Field label="Branch name" htmlFor="name">
                  <Input id="name" name="name" defaultValue={branch.name} required minLength={2} />
                </Field>
              </ActionForm>
            </CardContent>
          </Card>
        )}
        {links.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Go to</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {links.map((l) => (
                <Button key={l.href} asChild variant="outline" size="sm">
                  <Link href={l.href}>{l.label}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
