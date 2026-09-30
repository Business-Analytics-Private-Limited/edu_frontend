/**
 * A simple table.
 *
 *   <Table>
 *     <TableHead>
 *       <tr><Th>Name</Th><Th>Status</Th></tr>
 *     </TableHead>
 *     <tbody>
 *       <tr><Td>Sri Vidya</Td><Td><Badge>Active</Badge></Td></tr>
 *     </tbody>
 *   </Table>
 */
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border bg-card">
      <table className={cn('w-full text-sm', className)} {...props} />
    </div>
  );
}

export function TableHead({ className, ...props }: ComponentProps<'thead'>) {
  return <thead className={cn('border-b bg-muted/60', className)} {...props} />;
}

export function Th({ className, ...props }: ComponentProps<'th'>) {
  return (
    <th
      className={cn('px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground', className)}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<'td'>) {
  return <td className={cn('border-b px-4 py-3 align-middle', className)} {...props} />;
}
