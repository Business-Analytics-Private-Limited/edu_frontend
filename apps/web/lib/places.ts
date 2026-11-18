/**
 * Closed (inactive) branches (ADR-0026). Their records can still be read, but nothing new
 * happens there, so screens that START new work (admit, import, promote, give a role, add a
 * holiday or a section) only offer branches in use; screens that only SHOW data still list
 * closed branches, marked with branchName(): "KPHB · inactive".
 */
import type { Branch, Me } from './types';
import { branchesWith } from './me';

/** A branch's name, with "· inactive" when it is closed. */
export function branchName(branch: Pick<Branch, 'name' | 'status'>): string {
  return branch.status === 'ACTIVE' ? branch.name : `${branch.name} · inactive`;
}

/** The open branches where the user has `permission` (e.g. where they may admit students). */
export function branchesForWork(me: Me, branches: Branch[], permission: string): Branch[] {
  const allowed = branchesWith(me, permission);
  return branches.filter(
    (b) => b.status === 'ACTIVE' && (allowed === 'all' || allowed.includes(b.id)),
  );
}
