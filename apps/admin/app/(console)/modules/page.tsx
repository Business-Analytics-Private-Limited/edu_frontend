/**
 * /modules: the modules that can be switched on for organizations, and what each needs first.
 * Switching them on or off happens on an organization's page.
 */
import { Badge, PageHeader, Table, TableHead, Td, Th } from '@eduplatform/ui';
import { api } from '../../../lib/api';
import type { Module } from '../../../lib/types';

export default async function ModulesPage() {
  const modules = await api<Module[]>('/super-admin/modules');

  return (
    <>
      <PageHeader
        title="Modules"
        description="Switch modules on for an organization from its page. A module needs the modules in 'Needs first' to be on."
      />
      <Table>
        <TableHead>
          <tr>
            <Th>Module</Th>
            <Th>What it does</Th>
            <Th>Needs first</Th>
          </tr>
        </TableHead>
        <tbody>
          {modules.map((module) => (
            <tr key={module.key}>
              <Td className="font-medium">{module.name}</Td>
              <Td className="text-muted-foreground">{module.description}</Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {module.dependsOn.length === 0
                    ? '—'
                    : module.dependsOn.map((key) => (
                        <Badge key={key} variant="outline">
                          {key}
                        </Badge>
                      ))}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
